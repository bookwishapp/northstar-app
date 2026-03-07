const { execSync } = require('child_process');

// Run migrations
console.log('Running database migrations...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (error) {
  console.error('Migration warning:', error.message);
}

// Start Next.js server
console.log('Starting Next.js server...');
require('next/dist/cli/next-start');