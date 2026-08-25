import { db } from '../database/db';

export const categoryRepository = {
  listActive() {
    return db.categories.where('active').equals(1).sortBy('name');
  },

  getById(id: string) {
    return db.categories.get(id);
  },
};
