const { execSync } = require('child_process');

// Run migrations
console.log('Running database migrations...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

// Force the standalone server to use port 3000
process.env.PORT = '3000';
process.env.HOSTNAME = '0.0.0.0';

console.log('Starting server on port 3000...');

// Start the standalone server
require('./.next/standalone/server.js');