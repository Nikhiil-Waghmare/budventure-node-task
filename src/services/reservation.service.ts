import { prisma } from '../config/prisma';
import { ReserveItemRequest } from '../types';
import { itemRepository } from '../repositories/item.repository';
import { userRepository } from '../repositories/user.repository';
import { reservationRepository } from '../repositories/reservation.repository';
import { logger } from '../config/logger';

import { Prisma } from '@prisma/client';

export class ReservationError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = 'ReservationError';
  }
}

export class ReservationService {
  async reserveItem(data: ReserveItemRequest, maxRetries = 3): Promise<any> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await this.executeTransaction(data);
      } catch (error: any) {
        // P2034 is Prisma's code for transaction conflict/deadlock
        if (error.code === 'P2034' || error.message.includes('deadlock') || error.message.includes('serialization')) {
          attempt++;
          logger.warn({ attempt, maxRetries }, 'Database deadlock or conflict, retrying transaction');
          if (attempt >= maxRetries) throw error;
          
          // Exponential backoff
          await new Promise((res) => setTimeout(res, Math.pow(2, attempt) * 50));
        } else {
          throw error;
        }
      }
    }
  }

  private async executeTransaction(data: ReserveItemRequest): Promise<any> {
    const { userId, itemId, quantity } = data;

    return await prisma.$transaction(async (tx) => {
      const item = await itemRepository.findByIdForUpdate(itemId, tx);
      if (!item) throw new ReservationError('Item not found', 404);

      if (item.stock < quantity) throw new ReservationError('Insufficient stock', 400);

      const user = await userRepository.findByIdForUpdate(userId, tx);
      if (!user) throw new ReservationError('User not found', 404);

      // Use Prisma Decimal for precise calculation
      const price = new Prisma.Decimal(item.price);
      const totalCost = price.mul(quantity);
      const walletBalance = new Prisma.Decimal(user.walletBalance);

      if (walletBalance.lessThan(totalCost)) {
        throw new ReservationError('Insufficient wallet balance', 400);
      }

      const newStock = item.stock - quantity;
      await itemRepository.updateStock(itemId, newStock, tx);

      // totalCost is a Decimal, we pass toNumber() or the Decimal itself depending on the repo implementation
      // Our repo expects a number, let's pass a number for the decrement
      await userRepository.deductWallet(userId, totalCost.toNumber(), tx);

      const reservation = await reservationRepository.createReservation(data, tx);

      logger.info({ userId, itemId, quantity, reservationId: reservation.id }, 'Successfully reserved item');

      return {
        success: true,
        reservationId: reservation.id,
        item: item.name,
        quantity,
        totalCost: totalCost.toNumber(),
        remainingStock: newStock,
        remainingBalance: walletBalance.sub(totalCost).toNumber(),
      };
    });
  }
}

export const reservationService = new ReservationService();
