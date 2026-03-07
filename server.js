#!/usr/bin/env node

const { spawn } = require('child_process');

// Run migrations first
console.log('Running database migrations...');
const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env }
});

migrate.on('close', (code) => {
  if (code !== 0) {
    console.error('Migration failed with code', code);
  }

  // Set port to 3000 - Railway expects this
  process.env.PORT = '3000';
  process.env.HOSTNAME = '0.0.0.0';

  console.log('Starting server on port 3000...');

  // Start Next.js using next start which works with standalone
  const server = spawn('npx', ['next', 'start', '-p', '3000', '-H', '0.0.0.0'], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
});