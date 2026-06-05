import { prisma } from '../config/prisma';
import { ReserveItemRequest } from '../types';
import { itemRepository } from '../repositories/item.repository';
import { userRepository } from '../repositories/user.repository';
import { reservationRepository } from '../repositories/reservation.repository';
import { logger } from '../config/logger';

export class ReservationError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = 'ReservationError';
  }
}

export class ReservationService {
  /**
   * Reserves an item for a user.
   * This method uses PostgreSQL row-level locking (SELECT FOR UPDATE) within a transaction
   * to ensure concurrent requests do not oversell items or double-deduct from wallets.
   */
  async reserveItem(data: ReserveItemRequest): Promise<any> {
    const { userId, itemId, quantity } = data;

    // Use Prisma interactive transaction to group operations atomically
    return await prisma.$transaction(async (tx) => {
      // 1. Lock the item row
      // We must lock the item first to prevent concurrent transactions from modifying its stock.
      // If another transaction is currently holding the lock, this query will wait until that transaction completes.
      const item = await itemRepository.findByIdForUpdate(itemId, tx);
      if (!item) {
        throw new ReservationError('Item not found', 404);
      }

      // 2. Validate stock
      if (item.stock < quantity) {
        throw new ReservationError('Insufficient stock', 400);
      }

      // 3. Lock the user row
      // Lock the user to prevent concurrent wallet deductions.
      // Note: Always locking tables in the same order (e.g., items then users) prevents deadlocks.
      const user = await userRepository.findByIdForUpdate(userId, tx);
      if (!user) {
        throw new ReservationError('User not found', 404);
      }

      // 4. Validate wallet balance
      const totalCost = Number(item.price) * quantity;
      if (Number(user.walletBalance) < totalCost) {
        throw new ReservationError('Insufficient wallet balance', 400);
      }

      // 5. Deduct stock
      const newStock = item.stock - quantity;
      await itemRepository.updateStock(itemId, newStock, tx);

      // 6. Deduct wallet
      await userRepository.deductWallet(userId, totalCost, tx);

      // 7. Create reservation
      const reservation = await reservationRepository.createReservation(data, tx);

      logger.info(
        { userId, itemId, quantity, reservationId: reservation.id },
        'Successfully reserved item'
      );

      return {
        success: true,
        reservationId: reservation.id,
        item: item.name,
        quantity,
        totalCost,
        remainingStock: newStock,
        remainingBalance: Number(user.walletBalance) - totalCost,
      };
    });
  }
}

export const reservationService = new ReservationService();
