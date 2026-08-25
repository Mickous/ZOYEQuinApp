import { db } from '../database/db';
import type { Sale } from '../models/sales';

export const saleRepository = {
  getById(id: string) { return db.sales.get(id); },
  getByReceiptNumber(receiptNumber: string) { return db.sales.where('receiptNumber').equals(receiptNumber).first(); },
  listRecent(limit = 50) { return db.sales.orderBy('createdAt').reverse().limit(limit).toArray(); },
  async listCompleted(limit = 100) {
    const rows = await db.sales.where('status').equals('COMPLETED').toArray();
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  },
  async cancel(id: string): Promise<Sale> {
    return db.transaction('rw', db.sales, db.products, db.stockMovements, async () => {
      const sale = await db.sales.get(id);
      if (!sale) throw new Error('Vente introuvable.');
      if (sale.status === 'CANCELLED') throw new Error('Cette vente est déjà annulée.');
      const now = new Date().toISOString();
      for (const item of sale.items) {
        const product = await db.products.get(item.productId);
        if (!product) throw new Error(`Produit introuvable : ${item.productName}.`);
        const updated = { ...product, stockQuantity: product.stockQuantity + item.quantity, updatedAt: now };
        await db.products.put(updated);
        await db.stockMovements.add({ id: `stock_cancel_${sale.id}_${item.id}`, productId: item.productId, type: 'IN', quantityDelta: item.quantity, quantityBefore: product.stockQuantity, quantityAfter: updated.stockQuantity, reason: `Annulation ${sale.receiptNumber}`, referenceId: sale.id, unitCost: item.unitCost, createdAt: now });
      }
      const updatedSale = { ...sale, status: 'CANCELLED' as const, updatedAt: now };
      await db.sales.put(updatedSale);
      return updatedSale;
    });
  },
};
