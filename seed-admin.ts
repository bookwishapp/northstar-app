// seed-admin.ts
// Run with: npx ts-node seed-admin.ts
// Creates an admin user for the admin panel

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@northstarpostal.com';
  const password = 'NorthStar2024!'; // Change this password after first login!

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
    },
  });

  console.log('✅ Admin user created/updated:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Change this password after your first login!');
  console.log(`   Login at: /admin/login`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
