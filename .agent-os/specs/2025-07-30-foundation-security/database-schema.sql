-- Volteus Database Schema - Foundation & Security
-- Execute this in Supabase SQL Editor after project creation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'project_manager', 
  'sales_rep',
  'lead_technician',
  'technician'
);

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

-- Create indexes for performance
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_company_settings_tenant_id ON company_settings(tenant_id);
CREATE INDEX idx_labor_rates_tenant_id ON labor_rates(tenant_id);
CREATE INDEX idx_labor_rates_role ON labor_rates(role);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

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

-- Insert seed data for development
INSERT INTO tenants (name, slug, settings) VALUES 
('Clearpoint Technology + Design', 'clearpoint', '{
  "company_name": "Clearpoint Technology + Design",
  "primary_color": "#162944",
  "logo_url": null,
  "contact_email": "info@clearpoint.design"
}');

-- Insert default labor rates for Clearpoint tenant
INSERT INTO labor_rates (tenant_id, role, hourly_rate) 
SELECT 
  t.id,
  role_enum.role,
  CASE role_enum.role
    WHEN 'super_admin' THEN 150.00
    WHEN 'project_manager' THEN 125.00
    WHEN 'sales_rep' THEN 100.00
    WHEN 'lead_technician' THEN 85.00
    WHEN 'technician' THEN 65.00
  END
FROM tenants t
CROSS JOIN (
  SELECT unnest(enum_range(NULL::user_role)) as role
) role_enum
WHERE t.slug = 'clearpoint';

-- Insert default company settings
INSERT INTO company_settings (tenant_id, setting_key, setting_value)
SELECT 
  t.id,
  setting_key,
  setting_value::jsonb
FROM tenants t
CROSS JOIN (VALUES
  ('branding_primary_color', '"#162944"'),
  ('branding_company_name', '"Clearpoint Technology + Design"'),
  ('branding_logo_url', 'null'),
  ('contact_email', '"info@clearpoint.design"'),
  ('default_markup_percentage', '30'),
  ('quote_validity_days', '30')
) AS settings(setting_key, setting_value)
WHERE t.slug = 'clearpoint';