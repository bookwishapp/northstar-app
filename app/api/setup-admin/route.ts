import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    // Only allow in production for initial setup
    const setupToken = request.headers.get('x-setup-token');

    // Simple security: require a token
    if (setupToken !== 'setup-northstar-2024') {
      return NextResponse.json({ error: 'Invalid setup token' }, { status: 401 });
    }

    const email = 'admin@northstarpostal.com';
    const password = 'NorthStar2024!';
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: {
        email,
        passwordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created',
      email,
      password,
      warning: 'DELETE THIS ENDPOINT AFTER USE!'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}