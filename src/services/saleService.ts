import { db } from '../database/db';
import { createId } from '../utils/id';
import type { PaymentMethod, Sale, SaleItem } from '../models/sales';
import type { CreditAccount } from '../models/customer';

export type CreateSaleInput = {
  items: Array<{ productId: string; quantity: number; unitPrice?: number }>;
  discount?: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  customerId?: string;
  sellerId?: string;
};

export const saleService = {
  async create(input: CreateSaleInput): Promise<Sale> {
    if (!input.items.length) throw new Error('Une vente doit contenir au moins un produit.');
    if (!Number.isFinite(input.amountPaid) || input.amountPaid < 0) throw new Error('Montant payé invalide.');
    if (input.paymentMethod === 'CREDIT' && !input.customerId) throw new Error('Un client est obligatoire pour une vente à crédit.');

    return db.transaction('rw', db.sales, db.products, db.stockMovements, db.customers, db.creditAccounts, async () => {
      const grouped = new Map<string, { quantity: number; unitPrice?: number }>();
      for (const line of input.items) {
        if (!Number.isFinite(line.quantity) || line.quantity <= 0) throw new Error('Quantité de vente invalide.');
        const existing = grouped.get(line.productId);
        if (existing) {
          existing.quantity += line.quantity;
          if (line.unitPrice !== undefined) existing.unitPrice = line.unitPrice;
        } else grouped.set(line.productId, { quantity: line.quantity, unitPrice: line.unitPrice });
      }

      const saleItems: SaleItem[] = [];
      for (const [productId, line] of grouped) {
        const product = await db.products.get(productId);
        if (!product || !product.active) throw new Error('Produit introuvable ou inactif.');
        if (product.stockQuantity < line.quantity) throw new Error(`Stock insuffisant pour ${product.name}.`);
        const unitPrice = line.unitPrice ?? product.sellingPrice;
        if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`Prix invalide pour ${product.name}.`);
        saleItems.push({ id: createId('line'), productId: product.id, productName: product.name, unit: product.unit, quantity: line.quantity, unitPrice, unitCost: product.purchasePrice, subtotal: line.quantity * unitPrice, costTotal: line.quantity * product.purchasePrice });
      }

      const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
      const discount = input.discount ?? 0;
      if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) throw new Error('Remise invalide.');
      const total = subtotal - discount;
      if (input.paymentMethod === 'CREDIT' && input.amountPaid > total) throw new Error('Une vente à crédit ne peut pas être surpayée.');
      if (input.paymentMethod !== 'CREDIT' && input.amountPaid < total) throw new Error('Le montant payé est insuffisant.');

      const totalCost = saleItems.reduce((sum, item) => sum + item.costTotal, 0);
      const now = new Date().toISOString();
      const sale: Sale = { id: createId('sale'), receiptNumber: `V-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, items: saleItems, subtotal, discount, total, totalCost, grossProfit: total - totalCost, paymentMethod: input.paymentMethod, amountPaid: input.amountPaid, amountDue: Math.max(0, total - input.amountPaid), customerId: input.customerId, sellerId: input.sellerId, status: 'COMPLETED', createdAt: now, updatedAt: now };

      if (input.paymentMethod === 'CREDIT') {
        const customer = await db.customers.get(input.customerId!);
        if (!customer || !customer.active) throw new Error('Client introuvable ou inactif.');
      }

      for (const item of saleItems) {
        const product = await db.products.get(item.productId);
        if (!product) throw new Error(`Produit introuvable : ${item.productName}.`);
        const updated = { ...product, stockQuantity: product.stockQuantity - item.quantity, updatedAt: now };
        await db.products.put(updated);
        await db.stockMovements.add({ id: createId('stock'), productId: product.id, type: 'OUT', quantityDelta: -item.quantity, quantityBefore: product.stockQuantity, quantityAfter: updated.stockQuantity, reason: `Vente ${sale.receiptNumber}`, referenceId: sale.id, unitCost: product.purchasePrice, createdAt: now });
      }
      await db.sales.add(sale);

      if (input.paymentMethod === 'CREDIT') {
        const paid = input.amountPaid;
        const balance = total - paid;
        const credit: CreditAccount = { id: createId('credit'), customerId: input.customerId!, saleId: sale.id, originalAmount: total, paidAmount: paid, balance, status: balance === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'OPEN', createdAt: now, updatedAt: now };
        await db.creditAccounts.add(credit);
      }
      return sale;
    });
  },
};
