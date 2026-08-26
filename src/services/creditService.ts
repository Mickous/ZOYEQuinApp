import { db as defaultDb, type ZoyeDatabase } from '../database/db';
import { createId } from '../utils/id';
import type { CreditPaymentMethod, CreditAccount, CreditPayment, Customer } from '../models/customer';

export function createCreditService(database: ZoyeDatabase = defaultDb) {
  return {
    async createCustomer(input: { name: string; phone?: string; address?: string; notes?: string }): Promise<Customer> {
      const name = input.name.trim();
      if (!name) throw new Error('Le nom du client est obligatoire.');
      const now = new Date().toISOString();
      const customer: Customer = { id: createId('customer'), name, phone: input.phone?.trim() || undefined, address: input.address?.trim() || undefined, notes: input.notes?.trim() || undefined, active: true, createdAt: now, updatedAt: now };
      await database.customers.add(customer);
      return customer;
    },

    async createCreditAccount(input: { customerId: string; saleId: string; amount: number; paidAmount?: number }): Promise<CreditAccount> {
      return database.transaction('rw', database.customers, database.creditAccounts, async () => {
        const customer = await database.customers.get(input.customerId);
        if (!customer || !customer.active) throw new Error('Client introuvable ou inactif.');
        if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Montant du crédit invalide.');
        const paid = input.paidAmount ?? 0;
        if (!Number.isFinite(paid) || paid < 0 || paid > input.amount) throw new Error('Montant déjà payé invalide.');
        const balance = input.amount - paid;
        const now = new Date().toISOString();
        const account: CreditAccount = { id: createId('credit'), customerId: customer.id, saleId: input.saleId, originalAmount: input.amount, paidAmount: paid, balance, status: balance === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'OPEN', createdAt: now, updatedAt: now };
        await database.creditAccounts.add(account);
        return account;
      });
    },

    async recordPayment(input: { creditAccountId: string; amount: number; paymentMethod: CreditPaymentMethod; note?: string }): Promise<CreditAccount> {
      return database.transaction('rw', database.creditAccounts, database.creditPayments, async () => {
        const account = await database.creditAccounts.get(input.creditAccountId);
        if (!account) throw new Error('Crédit introuvable.');
        if (account.status === 'CANCELLED' || account.status === 'PAID') throw new Error('Ce crédit est déjà clôturé.');
        if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > account.balance) throw new Error('Montant de remboursement invalide.');
        const now = new Date().toISOString();
        const payment: CreditPayment = { id: createId('payment'), creditAccountId: account.id, customerId: account.customerId, amount: input.amount, paymentMethod: input.paymentMethod, note: input.note?.trim() || undefined, createdAt: now };
        const paidAmount = account.paidAmount + input.amount;
        const balance = account.originalAmount - paidAmount;
        const updated: CreditAccount = { ...account, paidAmount, balance, status: balance === 0 ? 'PAID' : 'PARTIAL', updatedAt: now };
        await database.creditPayments.add(payment);
        await database.creditAccounts.put(updated);
        return updated;
      });
    },
  };
}

export const creditService = createCreditService();
