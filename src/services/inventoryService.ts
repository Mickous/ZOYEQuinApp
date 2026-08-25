import { db } from '../database/db';
import { createId } from '../utils/id';
import type { Product, StockMovement, StockMovementType } from '../models/inventory';

export type StockChangeInput = {
  productId: string;
  quantity: number;
  type: StockMovementType;
  reason: string;
  referenceId?: string;
  unitCost?: number;
};

function assertPositiveQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('La quantité doit être supérieure à zéro.');
  }
}

export const inventoryService = {
  async changeStock(input: StockChangeInput): Promise<Product> {
    assertPositiveQuantity(input.quantity);

    return db.transaction('rw', db.products, db.stockMovements, async () => {
      const product = await db.products.get(input.productId);
      if (!product || !product.active) throw new Error('Produit introuvable ou inactif.');

      const delta = input.type === 'IN' || input.type === 'RETURN'
        ? input.quantity
        : -input.quantity;

      if (product.stockQuantity + delta < 0) {
        throw new Error('Stock insuffisant.');
      }

      const updated: Product = {
        ...product,
        stockQuantity: product.stockQuantity + delta,
        updatedAt: new Date().toISOString(),
      };

      const movement: StockMovement = {
        id: createId('stock'),
        productId: product.id,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason.trim() || 'Aucun motif indiqué',
        referenceId: input.referenceId,
        unitCost: input.unitCost,
        createdAt: new Date().toISOString(),
      };

      await db.products.put(updated);
      await db.stockMovements.put(movement);
      return updated;
    });
  },

  addStock(input: Omit<StockChangeInput, 'type'>) {
    return this.changeStock({ ...input, type: 'IN' });
  },

  removeStock(input: Omit<StockChangeInput, 'type'>) {
    return this.changeStock({ ...input, type: 'OUT' });
  },

  adjustStock(input: Omit<StockChangeInput, 'type'>) {
    return this.changeStock({ ...input, type: 'ADJUSTMENT' });
  },
};
