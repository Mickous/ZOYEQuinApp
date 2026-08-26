export type Customer = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreditStatus = 'OPEN' | 'PARTIAL' | 'PAID' | 'CANCELLED';
export type CreditPaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'OTHER';

export type CreditAccount = {
  id: string;
  customerId: string;
  saleId: string;
  originalAmount: number;
  paidAmount: number;
  balance: number;
  status: CreditStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreditPayment = {
  id: string;
  creditAccountId: string;
  customerId: string;
  amount: number;
  paymentMethod: CreditPaymentMethod;
  note?: string;
  createdAt: string;
};
