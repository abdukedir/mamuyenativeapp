import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

const categories = [
  'TVs',
  'Speakers',
  'Refrigerators',
  'Air Conditioners',
  'Laptops',
  'Mobile Phones',
  'Accessories',
];

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

async function main() {
  for (const name of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

  await prisma.user.upsert({
    where: { email: 'admin@electrostock.local' },
    update: {},
    create: {
      email: 'admin@electrostock.local',
      username: 'admin',
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
      passwordHash: await hashPassword('Admin12345!'),
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
