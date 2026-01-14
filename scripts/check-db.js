// Quick script to test database connection
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking DoctorQ setup...\n');

// Check if .env exists
const envPath = path.join(__dirname, 'apps', 'api', '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');

  // Read DATABASE_URL
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

  if (dbUrlMatch) {
    console.log('✅ DATABASE_URL is set');
    console.log(`   ${dbUrlMatch[1].replace(/:[^:@]+@/, ':****@')}`);
  } else {
    console.log('❌ DATABASE_URL not found in .env');
  }
} else {
  console.log('❌ .env file not found');
  console.log('   Creating .env file...');
}

console.log('\n📋 Next steps:');
console.log('\n1. Make sure PostgreSQL is running');
console.log('   - Docker: docker start doctorq-postgres');
console.log('   - Or check Windows Services for "postgresql"');
console.log('\n2. If using Docker for the first time, run:');
console.log('   docker run --name doctorq-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=doctorq -p 5432:5432 -d postgres:15');
console.log('\n3. Initialize database:');
console.log('   pnpm db:push');
console.log('   pnpm db:seed');
console.log('\n4. Start the app:');
console.log('   pnpm dev');
