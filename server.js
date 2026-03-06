const { execSync } = require('child_process');

// Run migrations
console.log('Running database migrations...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

// Start standalone server
console.log('Starting server...');
process.env.HOSTNAME = '0.0.0.0';
require('./.next/standalone/server.js');