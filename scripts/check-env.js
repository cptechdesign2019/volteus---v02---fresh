#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Validates all required environment variables for the application
 */

require('dotenv').config({ path: '.env.local' });

const envGroups = {
  'Supabase Configuration': [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  'Application Settings': [
    'NEXT_PUBLIC_APP_URL',
    'NEXTAUTH_SECRET',
    'NODE_ENV'
  ],
  'Google OAuth': [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]
};

const sensitiveKeys = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_SECRET'
];

console.log('🔧 Environment Configuration Check\n');

let totalVars = 0;
let validVars = 0;
let hasErrors = false;

for (const [groupName, variables] of Object.entries(envGroups)) {
  console.log(`📁 ${groupName}:`);
  
  for (const envVar of variables) {
    totalVars++;
    const value = process.env[envVar];
    const isSensitive = sensitiveKeys.includes(envVar);
    
    if (value) {
      validVars++;
      const displayValue = isSensitive ? 
        '••••••••' : 
        (value.length > 50 ? value.substring(0, 47) + '...' : value);
      
      console.log(`   ✅ ${envVar}: ${displayValue}`);
    } else {
      hasErrors = true;
      console.log(`   ❌ ${envVar}: NOT SET`);
    }
  }
  console.log();
}

// Summary
console.log('📊 Summary:');
console.log(`   Valid: ${validVars}/${totalVars} environment variables`);

if (hasErrors) {
  console.log('\n❌ Configuration Issues Detected');
  console.log('\n📋 Required Actions:');
  console.log('   1. Create .env.local file in project root');
  console.log('   2. Copy .env.example as template');
  console.log('   3. Fill in values from Supabase dashboard and Google Cloud Console');
  console.log('   4. Re-run this check: npm run check-env');
  
  process.exit(1);
} else {
  console.log('\n✅ All environment variables configured correctly!');
  console.log('\n🚀 Ready for development:');
  console.log('   npm run dev              # Start development server');
  console.log('   npm run test:supabase    # Test Supabase connection');
}

// Environment-specific warnings
if (process.env.NODE_ENV === 'production') {
  if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
    console.log('\n⚠️  Warning: Using localhost URL in production environment');
  }
}

if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
  console.log('\n⚠️  Warning: NEXTAUTH_SECRET should be at least 32 characters long');
}