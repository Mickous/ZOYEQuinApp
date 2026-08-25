import { db } from '../database/db';

export const saleRepository = {
  getById(id: string) {
    return db.sales.get(id);
  },

  getByReceiptNumber(receiptNumber: string) {
    return db.sales.where('receiptNumber').equals(receiptNumber).first();
  },

  listRecent(limit = 50) {
    return db.sales.orderBy('createdAt').reverse().limit(limit).toArray();
  },
};
