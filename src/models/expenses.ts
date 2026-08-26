export type ExpenseCategory = 'RENT' | 'UTILITIES' | 'TRANSPORT' | 'SALARY' | 'SUPPLIES' | 'MAINTENANCE' | 'TAX' | 'OTHER';

export type ExpensePaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'OTHER';

export type Expense = {
  id: string;
  category: ExpenseCategory;
  label: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  note?: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
};
