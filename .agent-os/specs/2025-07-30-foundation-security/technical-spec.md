# Technical Specification: Foundation & Security

> Spec: Foundation & Security  
> Created: 2025-07-30  
> Status: Planning  

## Architecture Overview

The Foundation & Security implementation establishes a secure, scalable multi-tenant architecture using Next.js 15, Supabase, and Render.com hosting. The system implements role-based access control with Google OAuth authentication and tenant isolation via Row Level Security.

## Database Schema

### Core Tables

```sql
-- Enable RLS and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table for multi-tenant isolation
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles extending Supabase auth.users
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'technician',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles enum
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'project_manager', 
  'sales_rep',
  'lead_technician',
  'technician'
);

-- Company settings
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, setting_key)
);

-- Labor rates by role
CREATE TABLE labor_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  hourly_rate DECIMAL(8,2) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for security tracking
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY "Users can only see their tenant data" ON user_profiles
  FOR ALL USING (tenant_id = (
    SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Settings isolated by tenant" ON company_settings
  FOR ALL USING (tenant_id = (
    SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Labor rates isolated by tenant" ON labor_rates
  FOR ALL USING (tenant_id = (
    SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Audit logs isolated by tenant" ON audit_logs
  FOR ALL USING (tenant_id = (
    SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
  ));

-- Super admin can access tenant management
CREATE POLICY "Super admins can manage tenants" ON tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

## API Design

### Authentication Routes
- `GET /api/auth/user` - Get current user profile and permissions
- `POST /api/auth/callback` - Handle Google OAuth callback
- `POST /api/auth/logout` - Sign out user and clear session

### Settings Management Routes
- `GET /api/settings/company` - Get company branding and configuration
- `PUT /api/settings/company` - Update company settings (Super Admin only)
- `GET /api/settings/labor-rates` - Get labor rates by role
- `PUT /api/settings/labor-rates` - Update labor rates (Super Admin only)

### User Management Routes
- `GET /api/users` - List all users in tenant (Super Admin/PM only)
- `POST /api/users/invite` - Invite new user (Super Admin only)
- `PUT /api/users/:id/role` - Update user role (Super Admin only)
- `DELETE /api/users/:id` - Deactivate user (Super Admin only)

### Audit Routes
- `GET /api/audit/logs` - Get audit trail (Super Admin only)
- `POST /api/audit/log` - Internal audit logging function

## Authentication Flow

### Google OAuth Integration
```typescript
// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    providers: ['google'],
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
  }
})

// Login flow
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}
```

### Session Management
- JWT tokens managed by Supabase Auth
- Automatic refresh on API calls
- 24-hour session timeout with extension on activity
- Secure httpOnly cookies for session persistence

## Middleware & Route Protection

### Authentication Middleware
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Redirect to login if no session
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  
  return res
}
```

### Role-Based Access Control
```typescript
// Role permissions matrix
const ROLE_PERMISSIONS = {
  super_admin: ['*'], // All permissions
  project_manager: ['projects:read', 'projects:write', 'users:read', 'reports:read'],
  sales_rep: ['quotes:read', 'quotes:write', 'customers:read', 'products:read'],
  lead_technician: ['projects:read', 'projects:update', 'mobile:access'],
  technician: ['projects:read', 'mobile:access']
}

// Permission check utility
export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes('*') || permissions.includes(permission)
}
```

## Security Features

### Password Gates
- Additional password verification for sensitive pages
- Configurable timeout (default: 15 minutes)
- Applied to: Customer data, Financial reports, User management

### Audit Logging
```typescript
// Audit logging utility
export async function logAuditEvent({
  action,
  resourceType,
  resourceId,
  details,
  req
}: AuditEventParams) {
  await supabase
    .from('audit_logs')
    .insert({
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent']
    })
}
```

### Rate Limiting
- 10 login attempts per IP per 15 minutes
- 100 API calls per user per minute
- Implemented via Render.com edge caching + Redis

## Environment Configuration

### Required Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Deployment Architecture

### Render.com Configuration
```yaml
# render.yaml
services:
  - type: web
    name: volteus-app
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
    domains:
      - volteus-staging.onrender.com # staging
      - volteus.clearpoint.design    # production
```

### CI/CD Pipeline
1. **Build Stage**: `npm ci && npm run build && npm run test`
2. **Security Scan**: OWASP dependency check
3. **Deploy to Staging**: Auto-deploy on `staging` branch
4. **Production Deploy**: Manual approval from `main` branch
5. **Health Check**: Verify deployment with smoke tests

## Performance Considerations

### Caching Strategy
- Static assets: 1 year cache via Render CDN
- API responses: 5-minute cache for settings data
- Database queries: Connection pooling via Supabase

### Database Optimization
- Indexes on tenant_id, user_id, created_at columns
- Partial indexes for active users/settings
- Query optimization for RLS policies

## Security Testing

### Automated Security Checks
- SQL injection testing on all API endpoints
- RBAC verification test suite
- Tenant isolation validation
- OAuth flow security testing

### Manual Testing Checklist
- [ ] Cross-tenant data access blocked
- [ ] Role permissions enforced correctly
- [ ] Password gates function properly
- [ ] Audit logging captures all sensitive actions
- [ ] Session timeout works as expected
- [ ] Google OAuth redirects securely