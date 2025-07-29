# Supabase OAuth Setup Guide

This project uses **port 3008** by default for local development. This guide ensures your OAuth configuration matches this setup.

## Quick Reference

- **Local Development URL**: `http://localhost:3008`
- **Auth Callback URL**: `http://localhost:3008/auth/callback`
- **Default Dev Command**: `npm run dev` (automatically uses port 3008)
- **Alternative Port**: `npm run dev:alt-port` (uses port 3009 if working on multiple projects)

## Step 1: Supabase Dashboard Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and ensure it's enabled
4. Enter your Google Client ID and Client Secret (from Step 2)
5. Navigate to **Authentication** → **URL Configuration**
6. Add these Redirect URLs:
   - `http://localhost:3008/**`
   - `http://localhost:3008/auth/callback`
   - Add your production URLs when deploying
7. Set Site URL to `http://localhost:3008` (for local development)

## Step 2: Google Cloud Console OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to **APIs & Services** → **Credentials**
4. Select your OAuth 2.0 Client ID (or create "Web application" type)
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3008`
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3008/auth/callback`

## Step 3: Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Port Configuration Notes

- **Why port 3008?** This project standardizes on port 3008 to avoid conflicts and ensure OAuth callbacks work consistently.
- **Multiple Projects?** Use `npm run dev:alt-port` for the second project, then update that project's OAuth settings to use port 3009.
- **Production?** Update all URLs to use your production domain when deploying.

## Common Issues

### "Redirect URI Mismatch" Error
- Verify exact URL match between Supabase and Google Cloud Console
- Check for typos in port numbers
- Ensure no trailing slashes in JavaScript origins

### OAuth Not Working Locally
- Confirm dev server is running on port 3008: `http://localhost:3008`
- Check browser developer tools for specific error messages
- Verify environment variables are loaded

## Testing Your Setup

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3008`
3. Test Google OAuth login
4. Check that new users appear in Supabase → Authentication → Users

---

*Last updated: $(date)*