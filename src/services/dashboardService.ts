import type { ZoyeDatabase } from '../database/db';

export type DashboardPeriod = { from?: string; to?: string };
export type DashboardMetrics = {
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  salesCount: number;
  customerReceivables: number;
  stockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export function createDashboardService(database: ZoyeDatabase) {
  return {
    async getMetrics(period: DashboardPeriod = {}): Promise<DashboardMetrics> {
      const sales = await database.sales.toArray();
      const products = await database.products.toArray();
      const credits = await database.creditAccounts.toArray();
      const start = period.from ? new Date(period.from).getTime() : -Infinity;
      const end = period.to ? new Date(period.to).getTime() : Infinity;
      const filteredSales = sales.filter((sale) => sale.status === 'COMPLETED' && new Date(sale.createdAt).getTime() >= start && new Date(sale.createdAt).getTime() <= end);
      const revenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
      const costOfGoods = filteredSales.reduce((sum, sale) => sum + sale.totalCost, 0);
      const grossProfit = filteredSales.reduce((sum, sale) => sum + sale.grossProfit, 0);
      const expenses = 0;
      const netProfit = grossProfit - expenses;
      const customerReceivables = credits.filter((credit) => credit.status !== 'CANCELLED').reduce((sum, credit) => sum + credit.balance, 0);
      const stockValue = products.filter((product) => product.active).reduce((sum, product) => sum + product.stockQuantity * product.purchasePrice, 0);
      return {
        revenue,
        costOfGoods,
        grossProfit,
        expenses,
        netProfit,
        salesCount: filteredSales.length,
        customerReceivables,
        stockValue,
        lowStockCount: products.filter((product) => product.active && product.stockQuantity > 0 && product.stockQuantity <= product.minimumStock).length,
        outOfStockCount: products.filter((product) => product.active && product.stockQuantity <= 0).length,
      };
    },
  };
}
