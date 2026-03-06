import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@northstarpostal.com';
  const password = 'admin123456'; // Change this in production!

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hashedPassword,
      },
    });

    console.log('Admin user created/updated:', admin.email);
    console.log('Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });