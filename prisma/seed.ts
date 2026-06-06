import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const user = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Alice',
      walletBalance: 1000.00,
    },
  });

  const usersToCreate = Array.from({ length: 100 }).map((_, i) => ({
    id: i + 2, 
    name: `Test User ${i + 2}`,
    walletBalance: 500.00,
  }));

  await prisma.user.createMany({
    data: usersToCreate,
    skipDuplicates: true,
  });

  const item = await prisma.item.upsert({
    where: { id: 101 },
    update: { stock: 5 }, 
    create: {
      id: 101,
      name: 'Premium Apples',
      stock: 5,
      price: 10.00,
    },
  });

  console.log({ user, item });
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
