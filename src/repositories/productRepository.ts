import { db } from '../database/db';
import type { Product } from '../models/inventory';
import { createId } from '../utils/id';

export const productRepository = {
  getById(id: string) {
    return db.products.get(id);
  },

  async listActive(): Promise<Product[]> {
    return (await db.products.toArray()).filter((product) => product.active).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  },

  async create(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    validateProductInput(input);
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
    validateProductInput(updated);
    await db.products.put(updated);
    return updated;
  },

  async deactivate(id: string): Promise<void> {
    await this.update(id, { active: false });
  },
};

function validateProductInput(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | Product) {
  if (!product.name.trim()) throw new Error('Le nom du produit est obligatoire.');
  if (!product.unit.trim()) throw new Error('L’unité du produit est obligatoire.');
  if (!Number.isFinite(product.purchasePrice) || product.purchasePrice < 0) throw new Error('Prix d’achat invalide.');
  if (!Number.isFinite(product.sellingPrice) || product.sellingPrice < 0) throw new Error('Prix de vente invalide.');
  if (!Number.isFinite(product.stockQuantity) || product.stockQuantity < 0) throw new Error('Stock initial invalide.');
  if (!Number.isFinite(product.minimumStock) || product.minimumStock < 0) throw new Error('Seuil de stock invalide.');
}
