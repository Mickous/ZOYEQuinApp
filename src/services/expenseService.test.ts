import { describe, expect, it } from 'vitest';
import { TestZoyeDatabase } from '../database/testDb';
import { createExpenseService } from './expenseService';

describe('expense service', () => {
  it('creates a valid expense', async () => {
    const database = new TestZoyeDatabase();
    await database.open();
    const expense = await createExpenseService(database).create({ category: 'UTILITIES', label: 'Electricité', amount: 15000, paymentMethod: 'CASH', expenseDate: '2026-08-20T10:00:00.000Z' });
    expect(expense.amount).toBe(15000);
    expect(await database.expenses.count()).toBe(1);
    await database.delete();
  });

  it('rejects empty labels and non-positive amounts', async () => {
    const database = new TestZoyeDatabase();
    await database.open();
    const service = createExpenseService(database);
    await expect(service.create({ category: 'OTHER', label: ' ', amount: 1000, paymentMethod: 'CASH' })).rejects.toThrow();
    await expect(service.create({ category: 'OTHER', label: 'Erreur', amount: 0, paymentMethod: 'CASH' })).rejects.toThrow();
    await database.delete();
  });

  it('filters expenses by date period', async () => {
    const database = new TestZoyeDatabase();
    await database.open();
    const service = createExpenseService(database);
    await service.create({ category: 'RENT', label: 'Loyer', amount: 50000, paymentMethod: 'MOBILE_MONEY', expenseDate: '2026-08-01T10:00:00.000Z' });
    await service.create({ category: 'TRANSPORT', label: 'Transport', amount: 5000, paymentMethod: 'CASH', expenseDate: '2026-08-20T10:00:00.000Z' });
    const expenses = await service.list({ from: '2026-08-15T00:00:00.000Z', to: '2026-08-31T23:59:59.999Z' });
    expect(expenses).toHaveLength(1);
    expect(expenses[0].amount).toBe(5000);
    await database.delete();
  });
});
