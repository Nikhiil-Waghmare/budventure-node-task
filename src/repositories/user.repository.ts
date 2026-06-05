import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export class UserRepository {
  /**
   * Locks the user row for update. Must be used within a transaction.
   */
  async findByIdForUpdate(userId: number, tx: Prisma.TransactionClient | typeof prisma = prisma) {
    const users = await tx.$queryRaw<any[]>`
      SELECT id, name, wallet_balance as "walletBalance" 
      FROM users 
      WHERE id = ${userId} 
      FOR UPDATE
    `;
    return users[0] || null;
  }

  async deductWallet(userId: number, amount: number, tx: Prisma.TransactionClient | typeof prisma = prisma) {
    return tx.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          decrement: amount,
        },
      },
    });
  }
}

export const userRepository = new UserRepository();
