import { prisma } from './dist/config/prisma.js';

async function reset() {
  try {
    await prisma.reservation.deleteMany();
    await prisma.item.update({
      where: { id: 101 },
      data: { stock: 5 }
    });
    console.log('Database reset successfully!');
  } catch (err) {
    console.error('Reset error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
