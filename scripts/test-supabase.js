#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Verifies that Supabase is properly configured and accessible
 */

require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
console.log('📋 Environment Variables:');
let envValid = true;
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  const status = value ? '✅' : '❌';
  const displayValue = value ? 
    (value.length > 50 ? value.substring(0, 47) + '...' : value) : 
    'NOT SET';
  
  console.log(`${status} ${envVar}: ${displayValue}`);
  if (!value) envValid = false;
}

if (!envValid) {
  console.log('\n❌ Missing required environment variables');
  console.log('📄 Create .env.local with the required values from Supabase dashboard');
  process.exit(1);
}

console.log('\n🔌 Testing Connection...');

// Dynamic import since we're in a Node.js script
import('@supabase/supabase-js').then(({ createClient }) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Test basic connection
  supabase.from('tenants').select('count', { count: 'exact', head: true })
    .then(({ data, error, count }) => {
      if (error) {
        console.log('❌ Database connection failed:');
        console.log(`   Error: ${error.message}`);
        console.log(`   Code: ${error.code || 'Unknown'}`);
        
        if (error.message.includes('auth')) {
          console.log('\n💡 Tip: Check your API keys in Supabase dashboard');
        }
        if (error.message.includes('tenant')) {
          console.log('\n💡 Tip: Run the database schema setup first');
        }
        
        process.exit(1);
      }

      console.log('✅ Database connection successful');
      console.log(`📊 Tenants table contains ${count || 0} records`);
      
      // Test auth configuration
      return supabase.auth.getSession();
    })
    .then(({ data, error }) => {
      if (error) {
        console.log('⚠️  Auth configuration warning:');
        console.log(`   ${error.message}`);
      } else {
        console.log('✅ Auth service accessible');
      }
      
      console.log('\n🎉 Supabase configuration test complete!');
      console.log('\n📋 Next steps:');
      console.log('   1. If database connection failed, run the schema setup');
      console.log('   2. Configure Google OAuth in Supabase dashboard');
      console.log('   3. Test authentication flow with: npm run dev');
    })
    .catch(err => {
      console.log('❌ Unexpected error:');
      console.log(`   ${err.message}`);
      process.exit(1);
    });
}).catch(err => {
  console.log('❌ Failed to load Supabase client library');
  console.log('💡 Run: npm install @supabase/supabase-js');
  process.exit(1);
});