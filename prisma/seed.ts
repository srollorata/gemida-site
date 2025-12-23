import { PrismaClient } from '../lib/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@family.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@family.com',
      password: adminPassword,
      role: 'admin',
      profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@family.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'user@family.com',
      password: userPassword,
      role: 'member',
      profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
    },
  });

  console.log('✅ Created user:', user.email);

  console.log('🎉 Seeding completed!');
  console.log('\nDemo accounts:');
  console.log('Admin - Email: admin@family.com, Password: admin123');
  console.log('User  - Email: user@family.com, Password: user123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });