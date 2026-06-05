import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export class ReservationRepository {
  async createReservation(
    data: { userId: number; itemId: number; quantity: number },
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ) {
    return tx.reservation.create({
      data: {
        userId: data.userId,
        itemId: data.itemId,
        quantity: data.quantity,
        status: 'confirmed',
      },
    });
  }
}

export const reservationRepository = new ReservationRepository();
