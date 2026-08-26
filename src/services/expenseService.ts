import type { ZoyeDatabase } from '../database/db';
import type { Expense, ExpenseCategory, ExpensePaymentMethod } from '../models/expenses';
import { createId } from '../utils/id';

export function createExpenseService(database: ZoyeDatabase) {
  return {
    async create(input: { category: ExpenseCategory; label: string; amount: number; paymentMethod: ExpensePaymentMethod; note?: string; expenseDate?: string }): Promise<Expense> {
      const label = input.label.trim();
      if (!label) throw new Error('Le libellé de la dépense est obligatoire.');
      if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Le montant de la dépense est invalide.');
      const now = new Date().toISOString();
      const expense: Expense = { id: createId('expense'), category: input.category, label, amount: input.amount, paymentMethod: input.paymentMethod, note: input.note?.trim() || undefined, expenseDate: input.expenseDate ?? now, createdAt: now, updatedAt: now };
      await database.expenses.add(expense);
      return expense;
    },

    list(period?: { from?: string; to?: string }) {
      return database.expenses.toArray().then((expenses) => expenses.filter((expense) => (!period?.from || expense.expenseDate >= period.from) && (!period?.to || expense.expenseDate <= period.to)).sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)));
    },

    async remove(id: string) {
      const expense = await database.expenses.get(id);
      if (!expense) throw new Error('Dépense introuvable.');
      await database.expenses.delete(id);
    },
  };
}
