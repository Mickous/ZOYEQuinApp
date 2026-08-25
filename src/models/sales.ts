export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'CREDIT' | 'OTHER';
export type SaleStatus = 'COMPLETED' | 'CANCELLED';

export type SaleItem = {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  costTotal: number;
};

export type Sale = {
  id: string;
  receiptNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  amountDue: number;
  customerId?: string;
  sellerId?: string;
  status: SaleStatus;
  createdAt: string;
  updatedAt: string;
};
