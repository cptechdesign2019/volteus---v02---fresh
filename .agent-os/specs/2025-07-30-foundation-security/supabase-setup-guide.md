# Supabase Setup Guide - Foundation & Security

> Task 1.2: Supabase Project Configuration  
> Part of Foundation & Security Spec  
> Estimated Time: 3 hours  

## Overview

This guide walks through setting up Supabase for the Volteus staging environment, including database configuration, authentication providers, and security policies.

## Step 1: Create Supabase Project

### 1.1 Project Creation
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. **Project Settings**:
   - **Name**: `volteus-staging`
   - **Database Password**: Use a strong, unique password (save to 1Password)
   - **Region**: Choose closest to your Render.com region
   - **Pricing Plan**: Start with Free tier

### 1.2 Wait for Database Initialization
- Project setup takes 2-3 minutes
- Wait for "Setting up project..." to complete
- Note your project URL and API keys

## Step 2: Database Schema Setup

### 2.1 Enable Extensions
Run in Supabase SQL Editor:

```sql
-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
-- (Will be applied to individual tables)
```

### 2.2 Create Core Tables
Execute the database schema from `technical-spec.md`:

```sql
-- Copy the entire database schema section from technical-spec.md
-- This includes: tenants, user_profiles, company_settings, labor_rates, audit_logs
-- Plus the user_role enum and all foreign key relationships
```

### 2.3 Apply Row Level Security
Execute the RLS policies from `technical-spec.md`:

```sql
-- Copy all RLS policies from technical-spec.md
-- This ensures tenant isolation and role-based access
```

## Step 3: Authentication Configuration

### 3.1 Configure Auth Settings
1. Navigate to **Authentication** → **Settings**
2. **Site URL**: `http://localhost:3008` (development)
3. **Redirect URLs**: Add these URLs:
   ```
   http://localhost:3008/**
   http://localhost:3008/auth/callback
   https://volteus-staging.onrender.com/**
   https://volteus-staging.onrender.com/auth/callback
   ```

### 3.2 Enable Google OAuth Provider
1. Navigate to **Authentication** → **Providers**
2. Find **Google** provider
3. **Enable** the provider
4. **Client ID**: (Get from Google Cloud Console - Step 4)
5. **Client Secret**: (Get from Google Cloud Console - Step 4)

## Step 4: Google Cloud Console Setup

### 4.1 Create OAuth Application
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select/Create project for Volteus
3. Navigate to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**

### 4.2 Configure OAuth Client
- **Application Type**: Web application
- **Name**: `Volteus Staging OAuth`
- **Authorized JavaScript Origins**:
  ```
  http://localhost:3008
  https://volteus-staging.onrender.com
  ```
- **Authorized Redirect URIs**:
  ```
  http://localhost:3008/auth/callback
  https://volteus-staging.onrender.com/auth/callback
  ```

### 4.3 Save Credentials
- Copy **Client ID** and **Client Secret**
- Return to Supabase and enter these values in the Google provider settings

## Step 5: API Keys and Environment Variables

### 5.1 Get Supabase API Keys
1. Navigate to **Settings** → **API**
2. Copy these values:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon/Public Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`) ⚠️ Keep secret!

### 5.2 Create Local Environment File
Create `.env.local` in project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3008

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth.js
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3008

# Development
NODE_ENV=development
```

## Step 6: Test Basic Connection

### 6.1 Install Supabase Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 6.2 Test Database Connection
Run this command to test:
```bash
npm run test:supabase-connection
```

### 6.3 Verify Auth Configuration
1. Start development server: `npm run dev`
2. Navigate to: `http://localhost:3008/api/health`
3. Should return healthy status
4. Test auth flow (will build in next task)

## Step 7: Staging Environment Setup

### 7.1 Production Supabase Project
Repeat Steps 1-5 for production:
- **Project Name**: `volteus-production`
- **Domain**: `https://volteus.clearpoint.design`
- **Separate OAuth client** in Google Cloud Console

### 7.2 Render.com Environment Variables
Add these environment variables in Render.com dashboard:
- All Supabase keys from Step 5.1
- Google OAuth credentials from Step 4.3
- Generate new `NEXTAUTH_SECRET` for production

## Security Checklist

- [ ] Service role key is marked as secret in environment
- [ ] OAuth redirect URLs exactly match configured domains
- [ ] RLS policies are enabled on all tables
- [ ] Database password is strong and stored securely
- [ ] API keys are different between staging/production
- [ ] Google OAuth has separate clients for staging/production

## Troubleshooting

### Common Issues
1. **OAuth Redirect Mismatch**: Ensure URLs in Google Cloud Console exactly match Supabase redirect URLs
2. **CORS Errors**: Check that Site URL in Supabase matches your application URL
3. **RLS Policy Issues**: Verify user_profiles table has data and policies reference correct columns

### Testing Commands
```bash
# Test Supabase connection
npx supabase test --db-url "your_supabase_url"

# Check environment variables
npm run check-env

# Verify OAuth endpoints
curl http://localhost:3008/api/auth/providers
```

## Next Steps

After completing this setup:
1. ✅ Supabase project configured with authentication
2. ➡️ **Task 2.1**: Database Schema Implementation
3. ➡️ **Task 2.2**: Row Level Security Policies
4. ➡️ **Task 3.1**: Google OAuth Integration (Next.js side)