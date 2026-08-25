import { db } from '../database/db';
import { createId } from '../utils/id';
import type { Category } from '../models/inventory';

export const categoryService = {
  async create(name: string): Promise<Category> {
    const normalized = name.trim();
    if (!normalized) throw new Error('Le nom de la catégorie est obligatoire.');

    const existing = await db.categories.where('name').equalsIgnoreCase(normalized).first();
    if (existing) throw new Error('Cette catégorie existe déjà.');

    const now = new Date().toISOString();
    const category: Category = { id: createId('category'), name: normalized, active: true, createdAt: now, updatedAt: now };
    await db.categories.add(category);
    return category;
  },

  async deactivate(id: string): Promise<void> {
    const category = await db.categories.get(id);
    if (!category) throw new Error('Catégorie introuvable.');
    await db.categories.put({ ...category, active: false, updatedAt: new Date().toISOString() });
  },
};
