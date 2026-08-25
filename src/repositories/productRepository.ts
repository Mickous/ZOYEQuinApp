import { db } from '../database/db';
import type { Product } from '../models/inventory';
import { createId } from '../utils/id';

export const productRepository = {
  getById(id: string) {
    return db.products.get(id);
  },

  listActive() {
    return db.products.where('active').equals(1).sortBy('name');
  },

  async create(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    const product: Product = { ...input, id: createId('product'), createdAt: now, updatedAt: now };
    await db.products.add(product);
    return product;
  },

  async update(id: string, changes: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
    const current = await db.products.get(id);
    if (!current) throw new Error('Produit introuvable.');

    const updated: Product = {
      ...current,
      ...changes,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await db.products.put(updated);
    return updated;
  },

  async deactivate(id: string): Promise<void> {
    await this.update(id, { active: false });
  },
};
