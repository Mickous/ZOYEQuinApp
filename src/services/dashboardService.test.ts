import { describe, expect, it } from 'vitest';
import { TestZoyeDatabase } from '../database/testDb';
import { createDashboardService } from './dashboardService';
import type { Product } from '../models/inventory';
import type { Sale } from '../models/sales';
import type { CreditAccount } from '../models/customer';
import type { Expense } from '../models/expenses';

async function seed(database: TestZoyeDatabase) {
  const now = new Date().toISOString();
  const product: Product = { id: 'p1', name: 'Ciment', unit: 'sac', purchasePrice: 5000, sellingPrice: 7000, stockQuantity: 10, minimumStock: 2, active: true, createdAt: now, updatedAt: now };
  const sale: Sale = { id: 's1', receiptNumber: 'V-1', items: [], subtotal: 21000, discount: 0, total: 21000, totalCost: 15000, grossProfit: 6000, paymentMethod: 'CASH', amountPaid: 21000, amountDue: 0, status: 'COMPLETED', createdAt: now, updatedAt: now };
  const credit: CreditAccount = { id: 'c1', customerId: 'customer-1', saleId: 's2', originalAmount: 10000, paidAmount: 4000, balance: 6000, status: 'PARTIAL', createdAt: now, updatedAt: now };
  const expense: Expense = { id: 'e1', category: 'UTILITIES', label: 'Electricité', amount: 1500, paymentMethod: 'CASH', expenseDate: now, createdAt: now, updatedAt: now };
  await database.products.put(product);
  await database.sales.put(sale);
  await database.creditAccounts.put(credit);
  await database.expenses.put(expense);
}

describe('dashboard service', () => {
  it('calculates revenue, costs, expenses, net profit, stock and receivables', async () => {
    const database = new TestZoyeDatabase();
    await database.open();
    await seed(database);
    const metrics = await createDashboardService(database).getMetrics();
    expect(metrics.revenue).toBe(21000);
    expect(metrics.costOfGoods).toBe(15000);
    expect(metrics.grossProfit).toBe(6000);
    expect(metrics.expenses).toBe(1500);
    expect(metrics.netProfit).toBe(4500);
    expect(metrics.salesCount).toBe(1);
    expect(metrics.customerReceivables).toBe(6000);
    expect(metrics.stockValue).toBe(50000);
    await database.delete();
  });

  it('filters expenses and sales by the selected period', async () => {
    const database = new TestZoyeDatabase();
    await database.open();
    const now = new Date().toISOString();
    await database.products.put({ id: 'p1', name: 'Ciment', unit: 'sac', purchasePrice: 5000, sellingPrice: 7000, stockQuantity: 10, minimumStock: 2, active: true, createdAt: now, updatedAt: now });
    await database.expenses.put({ id: 'e1', category: 'RENT', label: 'Loyer', amount: 50000, paymentMethod: 'CASH', expenseDate: '2026-07-01T10:00:00.000Z', createdAt: now, updatedAt: now });
    await database.expenses.put({ id: 'e2', category: 'TRANSPORT', label: 'Transport', amount: 5000, paymentMethod: 'CASH', expenseDate: '2026-08-20T10:00:00.000Z', createdAt: now, updatedAt: now });
    const metrics = await createDashboardService(database).getMetrics({ from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T23:59:59.999Z' });
    expect(metrics.expenses).toBe(5000);
    expect(metrics.netProfit).toBe(-5000);
    expect(metrics.salesCount).toBe(0);
    await database.delete();
  });
});
