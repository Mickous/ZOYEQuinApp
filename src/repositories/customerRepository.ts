import { db } from '../database/db';

export const customerRepository = {
  listActive() { return db.customers.where('active').equals(1).sortBy('name'); },
  getById(id: string) { return db.customers.get(id); },
  listCredits(customerId: string) { return db.creditAccounts.where('customerId').equals(customerId).reverse().sortBy('createdAt'); },
  listPayments(creditAccountId: string) { return db.creditPayments.where('creditAccountId').equals(creditAccountId).reverse().sortBy('createdAt'); },
  async getBalance(customerId: string) {
    const credits = await db.creditAccounts.where('customerId').equals(customerId).toArray();
    return credits.filter((credit) => credit.status !== 'CANCELLED').reduce((sum, credit) => sum + credit.balance, 0);
  },
};
