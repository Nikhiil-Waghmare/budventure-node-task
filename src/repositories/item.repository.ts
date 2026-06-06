import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export class ItemRepository {
 
  async findByIdForUpdate(itemId: number, tx: Prisma.TransactionClient | typeof prisma = prisma) {
    const items = await tx.$queryRaw<any[]>`
      SELECT id, name, stock, price 
      FROM items 
      WHERE id = ${itemId} 
      FOR UPDATE
    `;
    return items[0] || null;
  }

  async updateStock(itemId: number, newStock: number, tx: Prisma.TransactionClient | typeof prisma = prisma) {
    return tx.item.update({
      where: { id: itemId },
      data: { stock: newStock },
    });
  }
}

export const itemRepository = new ItemRepository();
