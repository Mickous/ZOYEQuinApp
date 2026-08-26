import Dexie, { type Table } from 'dexie';
import type { Category, Product, StockMovement } from '../models/inventory';
import type { Sale } from '../models/sales';
import type { Customer, CreditAccount, CreditPayment } from '../models/customer';

export class ZoyeDatabase extends Dexie {
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  stockMovements!: Table<StockMovement, string>;
  sales!: Table<Sale, string>;
  customers!: Table<Customer, string>;
  creditAccounts!: Table<CreditAccount, string>;
  creditPayments!: Table<CreditPayment, string>;

  constructor() {
    super('zoyequinapp');
    this.version(1).stores({
      categories: 'id, name, active',
      products: 'id, categoryId, sku, name, active, updatedAt',
      stockMovements: 'id, productId, type, createdAt, referenceId',
    });
    this.version(2).stores({
      categories: 'id, name, active',
      products: 'id, categoryId, sku, name, active, updatedAt',
      stockMovements: 'id, productId, type, createdAt, referenceId',
      sales: 'id, receiptNumber, status, paymentMethod, customerId, sellerId, createdAt',
    });
    this.version(3).stores({
      categories: 'id, name, active',
      products: 'id, categoryId, sku, name, active, updatedAt',
      stockMovements: 'id, productId, type, createdAt, referenceId',
      sales: 'id, receiptNumber, status, paymentMethod, customerId, sellerId, createdAt',
      customers: 'id, name, phone, active, updatedAt',
      creditAccounts: 'id, customerId, saleId, status, createdAt, updatedAt',
      creditPayments: 'id, creditAccountId, customerId, paymentMethod, createdAt',
    });
  }
}

export const db = new ZoyeDatabase();
