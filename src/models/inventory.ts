export type EntityId = string;

export type Category = {
  id: EntityId;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: EntityId;
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: EntityId;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';

export type StockMovement = {
  id: EntityId;
  productId: EntityId;
  type: StockMovementType;
  quantity: number;
  reason: string;
  referenceId?: EntityId;
  unitCost?: number;
  createdAt: string;
};
