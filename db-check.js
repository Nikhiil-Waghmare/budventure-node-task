import { prisma } from './dist/config/prisma.js';

async function check() {
  const item = await prisma.item.findUnique({
    where: { id: 101 }
  });
  console.log('--- Database Check Post-Test ---');
  console.log('Item stock:', item.stock);
  
  const reservations = await prisma.reservation.findMany();
  console.log('Confirmed reservations count:', reservations.length);
  
  const usersWithReservations = await prisma.user.findMany({
    where: {
      reservations: {
        some: {}
      }
    },
    include: {
      reservations: true
    }
  });
  
  console.log('Users who succeeded:');
  usersWithReservations.forEach(u => {
    console.log(`- User ID ${u.id}: Name: ${u.name}, Balance: ${u.walletBalance}`);
  });
  
  await prisma.$disconnect();
}

check();
