import { Prisma } from '@prisma/client';

export class ItemRepository {
  /**
   * Locks the item row for update. Must be used within a transaction.
   */
  async findByIdForUpdate(itemId: number, tx: Prisma.TransactionClient) {
    const items = await tx.$queryRaw<any[]>`
      SELECT id, name, stock, price 
      FROM items 
      WHERE id = ${itemId} 
      FOR UPDATE
    `;
    return items[0] || null;
  }

  async updateStock(itemId: number, newStock: number, tx: Prisma.TransactionClient) {
    return tx.item.update({
      where: { id: itemId },
      data: { stock: newStock },
    });
  }
}

export const itemRepository = new ItemRepository();
