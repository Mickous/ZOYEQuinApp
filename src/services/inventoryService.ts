import { db } from '../database/db';
import { createId } from '../utils/id';
import type { Product, StockMovement, StockMovementType } from '../models/inventory';

export type StockChangeInput = {
  productId: string;
  quantity: number;
  type: Exclude<StockMovementType, 'ADJUSTMENT'>;
  reason: string;
  referenceId?: string;
  unitCost?: number;
};

function assertPositiveQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('La quantité doit être supérieure à zéro.');
  }
}

function assertReason(reason: string) {
  if (!reason.trim()) throw new Error('Le motif du mouvement est obligatoire.');
}

export const inventoryService = {
  async changeStock(input: StockChangeInput): Promise<Product> {
    assertPositiveQuantity(input.quantity);
    assertReason(input.reason);

    return db.transaction('rw', db.products, db.stockMovements, async () => {
      const product = await db.products.get(input.productId);
      if (!product || !product.active) throw new Error('Produit introuvable ou inactif.');

      const delta = input.type === 'IN' || input.type === 'RETURN'
        ? input.quantity
        : -input.quantity;

      if (product.stockQuantity + delta < 0) throw new Error('Stock insuffisant.');

      return applyStockDelta(product, delta, input.type, input.reason, input.referenceId, input.unitCost);
    });
  },

  async adjustStock(input: { productId: string; delta: number; reason: string; referenceId?: string; unitCost?: number }): Promise<Product> {
    if (!Number.isFinite(input.delta) || input.delta === 0) {
      throw new Error('La variation d’ajustement doit être différente de zéro.');
    }
    assertReason(input.reason);

    return db.transaction('rw', db.products, db.stockMovements, async () => {
      const product = await db.products.get(input.productId);
      if (!product || !product.active) throw new Error('Produit introuvable ou inactif.');
      if (product.stockQuantity + input.delta < 0) throw new Error('L’ajustement ne peut pas rendre le stock négatif.');

      return applyStockDelta(product, input.delta, 'ADJUSTMENT', input.reason, input.referenceId, input.unitCost);
    });
  },

  addStock(input: Omit<StockChangeInput, 'type'>) {
    return this.changeStock({ ...input, type: 'IN' });
  },

  removeStock(input: Omit<StockChangeInput, 'type'>) {
    return this.changeStock({ ...input, type: 'OUT' });
  },
};

async function applyStockDelta(
  product: Product,
  delta: number,
  type: StockMovementType,
  reason: string,
  referenceId?: string,
  unitCost?: number,
): Promise<Product> {
  const now = new Date().toISOString();
  const nextQuantity = product.stockQuantity + delta;
  const updated: Product = { ...product, stockQuantity: nextQuantity, updatedAt: now };

  const movement: StockMovement = {
    id: createId('stock'),
    productId: product.id,
    type,
    quantityDelta: delta,
    quantityBefore: product.stockQuantity,
    quantityAfter: nextQuantity,
    reason: reason.trim(),
    referenceId,
    unitCost,
    createdAt: now,
  };

  await db.products.put(updated);
  await db.stockMovements.add(movement);
  return updated;
}
