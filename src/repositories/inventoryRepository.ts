import { db } from '../database/db';
import type { Category, Product, StockMovement } from '../models/inventory';

export const inventoryRepository = {
  listProducts: () => db.products.filter((product) => product.active).toArray(),
  getProduct: (id: string) => db.products.get(id),
  saveProduct: (product: Product) => db.products.put(product),
  saveCategory: (category: Category) => db.categories.put(category),
  listCategories: () => db.categories.filter((category) => category.active).toArray(),
  saveStockMovement: (movement: StockMovement) => db.stockMovements.put(movement),
  listStockMovements: (productId: string) =>
    db.stockMovements.where('productId').equals(productId).reverse().sortBy('createdAt'),
};
