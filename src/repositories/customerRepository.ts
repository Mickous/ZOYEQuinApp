import { db } from '../database/db';

export const customerRepository = {
  async listActive() {
    const customers = await db.customers.toArray();
    return customers.filter((customer) => customer.active).sort((a, b) => a.name.localeCompare(b.name));
  },
  getById(id: string) { return db.customers.get(id); },
  async listCredits(customerId: string) {
    const credits = await db.creditAccounts.where('customerId').equals(customerId).toArray();
    return credits.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async listPayments(creditAccountId: string) {
    const payments = await db.creditPayments.where('creditAccountId').equals(creditAccountId).toArray();
    return payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getBalance(customerId: string) {
    const credits = await db.creditAccounts.where('customerId').equals(customerId).toArray();
    return credits.filter((credit) => credit.status !== 'CANCELLED').reduce((sum, credit) => sum + credit.balance, 0);
  },
};
