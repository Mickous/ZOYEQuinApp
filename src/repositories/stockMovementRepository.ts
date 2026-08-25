import { db } from '../database/db';
import type { StockMovement } from '../models/inventory';

export const stockMovementRepository = {
  async listByProduct(productId: string): Promise<StockMovement[]> {
    return (await db.stockMovements.where('productId').equals(productId).toArray())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listRecent(limit = 100): Promise<StockMovement[]> {
    return (await db.stockMovements.toArray())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },
};
