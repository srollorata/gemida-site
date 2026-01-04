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

  // Create FamilyMembers for demo users
  const adminMember = await prisma.familyMember.upsert({
    where: { id: 'member-admin' },
    update: {
      name: 'Admin Family',
      profileImage: admin.profileImage,
    },
    create: {
      id: 'member-admin',
      name: 'Admin Family',
      birthDate: new Date('1980-06-15'),
      weddingDate: new Date('2005-09-10'),
      profileImage: admin.profileImage,
    },
  });

  const demoMember = await prisma.familyMember.upsert({
    where: { id: 'member-demo' },
    update: {
      name: 'Demo Person',
      profileImage: user.profileImage,
    },
    create: {
      id: 'member-demo',
      name: 'Demo Person',
      birthDate: new Date('1990-03-22'),
      weddingDate: new Date('2018-08-18'),
      profileImage: user.profileImage,
    },
  });

  // Link users to family members
  await prisma.user.update({ where: { id: admin.id }, data: { familyMemberId: adminMember.id } });
  await prisma.user.update({ where: { id: user.id }, data: { familyMemberId: demoMember.id } });

  console.log('✅ Created family members and linked to users');

  // Create sample events
  const upcomingEvent = await prisma.event.upsert({
    where: { id: 'event-reunion' },
    update: {},
    create: {
      id: 'event-reunion',
      title: 'Family Reunion',
      description: 'Annual family reunion at the lakeside.',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days in future
      type: 'PLAN',
      status: 'PENDING',
      location: 'Lakeside Park',
      createdById: admin.id,
      photos: [],
      participants: { connect: [{ id: adminMember.id }, { id: demoMember.id }] },
    },
  });

  const pastEvent = await prisma.event.upsert({
    where: { id: 'event-wedding-2018' },
    update: {},
    create: {
      id: 'event-wedding-2018',
      title: 'Wedding Anniversary',
      description: 'Celebration of Demo Person wedding.',
      date: new Date('2018-08-18'),
      type: 'MILESTONE',
      status: 'COMPLETED',
      completedAt: new Date('2018-08-18'),
      location: 'City Hall',
      createdById: user.id,
      photos: [],
      participants: { connect: [{ id: demoMember.id }] },
    },
  });

  console.log('✅ Created sample events');

  // Create a manual timeline event
  const timelineBirth = await prisma.timelineEvent.upsert({
    where: { id: 'timeline-birth-demo' },
    update: {},
    create: {
      id: 'timeline-birth-demo',
      title: 'Demo Person Born',
      description: 'Birth of Demo Person',
      date: new Date('1990-03-22'),
      type: 'BIRTH',
      familyMemberId: demoMember.id,
      relatedMembers: { connect: [] },
      isAutoAdded: false,
    },
  });

  console.log('✅ Created timeline events');

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