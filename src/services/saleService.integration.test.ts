import { beforeEach, describe, expect, it } from 'vitest';
import { TestZoyeDatabase } from '../database/testDb';
import { createSaleService } from './saleService';
import { createCreditService } from './creditService';
import type { Product } from '../models/inventory';

let testDb: TestZoyeDatabase;

async function seedProduct(stockQuantity = 10): Promise<Product> {
  const now = new Date().toISOString();
  const product: Product = { id: 'product-1', name: 'Ciment', unit: 'sac', purchasePrice: 5000, sellingPrice: 7000, stockQuantity, minimumStock: 2, active: true, createdAt: now, updatedAt: now };
  await testDb.products.put(product);
  return product;
}

describe('sale service integration', () => {
  beforeEach(async () => {
    testDb = new TestZoyeDatabase();
    await testDb.open();
  });

  it('reduces stock and records a cash sale', async () => {
    const product = await seedProduct();
    const service = createSaleService(testDb);

    const sale = await service.create({ items: [{ productId: product.id, quantity: 3 }], paymentMethod: 'CASH', amountPaid: 21000 });
    const updated = await testDb.products.get(product.id);
    const movements = await testDb.stockMovements.toArray();

    expect(sale.total).toBe(21000);
    expect(sale.grossProfit).toBe(6000);
    expect(updated?.stockQuantity).toBe(7);
    expect(movements).toHaveLength(1);
    expect(movements[0].quantityDelta).toBe(-3);
  });

  it('creates a credit account and records the initial payment', async () => {
    const product = await seedProduct();
    const creditService = createCreditService(testDb);
    const customer = await creditService.createCustomer({ name: 'Jean Kouassi', phone: '0700000000' });
    const saleService = createSaleService(testDb);

    const sale = await saleService.create({ items: [{ productId: product.id, quantity: 2 }], paymentMethod: 'CREDIT', amountPaid: 4000, customerId: customer.id });
    const credits = await testDb.creditAccounts.toArray();
    const payments = await testDb.creditPayments.toArray();

    expect(sale.amountDue).toBe(10000);
    expect(credits[0]).toMatchObject({ originalAmount: 14000, paidAmount: 4000, balance: 10000, status: 'PARTIAL' });
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(4000);
  });

  it('records repayments until a credit is fully paid', async () => {
    const product = await seedProduct();
    const creditService = createCreditService(testDb);
    const customer = await creditService.createCustomer({ name: 'Awa Traore' });
    const saleService = createSaleService(testDb);
    await saleService.create({ items: [{ productId: product.id, quantity: 2 }], paymentMethod: 'CREDIT', amountPaid: 0, customerId: customer.id });
    const credit = (await testDb.creditAccounts.toArray())[0];

    const partial = await creditService.recordPayment({ creditAccountId: credit.id, amount: 5000, paymentMethod: 'MOBILE_MONEY' });
    const paid = await creditService.recordPayment({ creditAccountId: credit.id, amount: 9000, paymentMethod: 'CASH' });

    expect(partial.balance).toBe(9000);
    expect(paid.balance).toBe(0);
    expect(paid.status).toBe('PAID');
    expect(await testDb.creditPayments.count()).toBe(2);
  });

  it('rejects insufficient stock without changing the stock', async () => {
    const product = await seedProduct(2);
    const service = createSaleService(testDb);

    await expect(service.create({ items: [{ productId: product.id, quantity: 3 }], paymentMethod: 'CASH', amountPaid: 21000 })).rejects.toThrow('Stock insuffisant');
    expect((await testDb.products.get(product.id))?.stockQuantity).toBe(2);
    expect(await testDb.sales.count()).toBe(0);
    expect(await testDb.stockMovements.count()).toBe(0);
  });

  it('rejects a credit sale without a customer', async () => {
    const product = await seedProduct();
    const service = createSaleService(testDb);

    await expect(service.create({ items: [{ productId: product.id, quantity: 1 }], paymentMethod: 'CREDIT', amountPaid: 0 })).rejects.toThrow('client est obligatoire');
    expect(await testDb.sales.count()).toBe(0);
    expect((await testDb.products.get(product.id))?.stockQuantity).toBe(10);
  });
});
