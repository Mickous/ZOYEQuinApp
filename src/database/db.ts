import Dexie, { type Table } from 'dexie';
import type { Category, Product, StockMovement } from '../models/inventory';

export class ZoyeDatabase extends Dexie {
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  stockMovements!: Table<StockMovement, string>;

  constructor() {
    super('zoyequinapp');
    this.version(1).stores({
      categories: 'id, name, active',
      products: 'id, categoryId, sku, name, active, updatedAt',
      stockMovements: 'id, productId, type, createdAt, referenceId',
    });
  }
}

export const db = new ZoyeDatabase();
