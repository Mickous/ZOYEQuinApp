import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { TestZoyeDatabase } from '../database/testDb';
import { createSaleService } from './saleService';
import { createCreditService } from './creditService';
import type { Product } from '../models/inventory';

function makeProduct(): Product {
  const now = new Date().toISOString();
  return { id: 'product_1', name: 'Ciment', unit: 'sac', purchasePrice: 5000, sellingPrice: 7000, stockQuantity: 10, minimumStock: 2, active: true, createdAt: now, updatedAt: now };
}

describe('sale service integration', () => {
  const databases: TestZoyeDatabase[] = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map(async (database) => { await database.delete(); }));
  });

  it('decreases stock and records an OUT movement for a cash sale', async () => {
    const database = new TestZoyeDatabase(); databases.push(database); await database.open();
    await database.products.add(makeProduct());
    const service = createSaleService(database);

    const sale = await service.create({ items: [{ productId: 'product_1', quantity: 3 }], paymentMethod: 'CASH', amountPaid: 21000 });

    expect(sale.total).toBe(21000);
    expect(await database.products.get('product_1')).toMatchObject({ stockQuantity: 7 });
    expect(await database.sales.count()).toBe(1);
    expect(await database.stockMovements.count()).toBe(1);
  });

  it('creates a credit and records the initial payment', async () => {
    const database = new TestZoyeDatabase(); databases.push(database); await database.open();
    await database.products.add(makeProduct());
    const credit = createCreditService(database);
    const customer = await credit.createCustomer({ name: 'Jean Kouassi' });
    const service = createSaleService(database);

    const sale = await service.create({ items: [{ productId: 'product_1', quantity: 2 }], paymentMethod: 'CREDIT', amountPaid: 4000, customerId: customer.id, initialCreditPaymentMethod: 'MOBILE_MONEY' });
    const account = await database.creditAccounts.where('saleId').equals(sale.id).first();
    const payments = await database.creditPayments.where('creditAccountId').equals(account!.id).toArray();

    expect(account).toMatchObject({ originalAmount: 14000, paidAmount: 4000, balance: 10000, status: 'PARTIAL' });
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({ amount: 4000, paymentMethod: 'MOBILE_MONEY' });
    expect(await database.products.get('product_1')).toMatchObject({ stockQuantity: 8 });
  });

  it('rolls back the whole sale when stock is insufficient', async () => {
    const database = new TestZoyeDatabase(); databases.push(database); await database.open();
    await database.products.add(makeProduct());
    const service = createSaleService(database);

    await expect(service.create({ items: [{ productId: 'product_1', quantity: 11 }], paymentMethod: 'CASH', amountPaid: 77000 })).rejects.toThrow('Stock insuffisant');
    expect(await database.products.get('product_1')).toMatchObject({ stockQuantity: 10 });
    expect(await database.sales.count()).toBe(0);
    expect(await database.stockMovements.count()).toBe(0);
  });

  it('rejects a credit sale without a customer before changing data', async () => {
    const database = new TestZoyeDatabase(); databases.push(database); await database.open();
    await database.products.add(makeProduct());
    const service = createSaleService(database);

    await expect(service.create({ items: [{ productId: 'product_1', quantity: 1 }], paymentMethod: 'CREDIT', amountPaid: 0 })).rejects.toThrow('client est obligatoire');
    expect(await database.products.get('product_1')).toMatchObject({ stockQuantity: 10 });
    expect(await database.sales.count()).toBe(0);
  });
});
