import Dexie, { type Table } from 'dexie';
import type { Category, Product, StockMovement } from '../models/inventory';
import type { Sale } from '../models/sales';

export class ZoyeDatabase extends Dexie {
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  stockMovements!: Table<StockMovement, string>;
  sales!: Table<Sale, string>;

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
  }
}

export const db = new ZoyeDatabase();
