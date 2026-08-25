import type { Product } from '../models/inventory';

export type StockStatus = 'out' | 'low' | 'ok';

export function getStockStatus(product: Product): StockStatus {
  if (product.stockQuantity <= 0) return 'out';
  if (product.stockQuantity <= product.minimumStock) return 'low';
  return 'ok';
}

export function getStockValue(product: Product): number {
  return product.stockQuantity * product.purchasePrice;
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}
