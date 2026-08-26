import type { ZoyeDatabase } from '../database/db';

export type DashboardPeriod = { from?: string; to?: string };
export type DashboardTopProduct = { productId: string; productName: string; quantity: number; revenue: number; grossProfit: number };
export type DashboardRecentSale = { id: string; receiptNumber: string; total: number; paymentMethod: string; createdAt: string };
export type DashboardRecentExpense = { id: string; label: string; amount: number; category: string; expenseDate: string };
export type DashboardReceivable = { customerId: string; balance: number; originalAmount: number; status: string };
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
  topProducts: DashboardTopProduct[];
  recentSales: DashboardRecentSale[];
  recentExpenses: DashboardRecentExpense[];
  receivables: DashboardReceivable[];
};

export function createDashboardService(database: ZoyeDatabase) {
  return {
    async getMetrics(period: DashboardPeriod = {}): Promise<DashboardMetrics> {
      const [sales, products, credits, expenses] = await Promise.all([
        database.sales.toArray(), database.products.toArray(), database.creditAccounts.toArray(), database.expenses.toArray(),
      ]);
      const start = period.from ? new Date(period.from).getTime() : -Infinity;
      const end = period.to ? new Date(period.to).getTime() : Infinity;
      const filteredSales = sales.filter((sale) => sale.status === 'COMPLETED' && new Date(sale.createdAt).getTime() >= start && new Date(sale.createdAt).getTime() <= end);
      const filteredExpenses = expenses.filter((expense) => { const date = new Date(expense.expenseDate).getTime(); return date >= start && date <= end; });
      const revenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
      const costOfGoods = filteredSales.reduce((sum, sale) => sum + sale.totalCost, 0);
      const grossProfit = filteredSales.reduce((sum, sale) => sum + sale.grossProfit, 0);
      const expenseTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const productMap = new Map<string, DashboardTopProduct>();
      for (const sale of filteredSales) for (const item of sale.items) {
        const current = productMap.get(item.productId) ?? { productId: item.productId, productName: item.productName, quantity: 0, revenue: 0, grossProfit: 0 };
        current.quantity += item.quantity; current.revenue += item.subtotal; current.grossProfit += item.subtotal - item.costTotal; productMap.set(item.productId, current);
      }
      const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      const customerReceivables = credits.filter((credit) => credit.status !== 'CANCELLED').reduce((sum, credit) => sum + credit.balance, 0);
      const receivables = credits.filter((credit) => credit.status !== 'CANCELLED' && credit.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 5).map((credit) => ({ customerId: credit.customerId, balance: credit.balance, originalAmount: credit.originalAmount, status: credit.status }));
      const stockValue = products.filter((product) => product.active).reduce((sum, product) => sum + product.stockQuantity * product.purchasePrice, 0);
      return {
        revenue, costOfGoods, grossProfit, expenses: expenseTotal, netProfit: grossProfit - expenseTotal, salesCount: filteredSales.length, customerReceivables, stockValue,
        lowStockCount: products.filter((product) => product.active && product.stockQuantity > 0 && product.stockQuantity <= product.minimumStock).length,
        outOfStockCount: products.filter((product) => product.active && product.stockQuantity <= 0).length,
        topProducts,
        recentSales: [...filteredSales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((sale) => ({ id: sale.id, receiptNumber: sale.receiptNumber, total: sale.total, paymentMethod: sale.paymentMethod, createdAt: sale.createdAt })),
        recentExpenses: [...filteredExpenses].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)).slice(0, 5).map((expense) => ({ id: expense.id, label: expense.label, amount: expense.amount, category: expense.category, expenseDate: expense.expenseDate })),
        receivables,
      };
    },
  };
}
