import type { ZoyeDatabase } from '../database/db';

export type DashboardPeriod = { from?: string; to?: string };
export type DashboardTrendPoint = { date: string; revenue: number; grossProfit: number; expenses: number; netProfit: number };
export type DashboardTopProduct = { productId: string; productName: string; quantity: number; revenue: number; grossProfit: number };
export type DashboardRecentSale = { id: string; receiptNumber: string; total: number; paymentMethod: string; createdAt: string };
export type DashboardRecentExpense = { id: string; label: string; amount: number; category: string; expenseDate: string };
export type DashboardReceivable = { customerId: string; customerName: string; customerPhone?: string; balance: number; originalAmount: number; status: string };
export type DashboardMetrics = { revenue:number; costOfGoods:number; grossProfit:number; expenses:number; netProfit:number; salesCount:number; customerReceivables:number; stockValue:number; lowStockCount:number; outOfStockCount:number; trend:DashboardTrendPoint[]; topProducts:DashboardTopProduct[]; recentSales:DashboardRecentSale[]; recentExpenses:DashboardRecentExpense[]; receivables:DashboardReceivable[] };
const dayKey=(iso:string)=>{const d=new Date(iso);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export function createDashboardService(database:ZoyeDatabase){return{async getMetrics(period:DashboardPeriod={}):Promise<DashboardMetrics>{
 const [sales,products,customers,credits,expenses]=await Promise.all([database.sales.toArray(),database.products.toArray(),database.customers.toArray(),database.creditAccounts.toArray(),database.expenses.toArray()]);
 const start=period.from?new Date(period.from).getTime():-Infinity,end=period.to?new Date(period.to).getTime():Infinity;
 const filteredSales=sales.filter(s=>s.status==='COMPLETED'&&new Date(s.createdAt).getTime()>=start&&new Date(s.createdAt).getTime()<=end);
 const filteredExpenses=expenses.filter(e=>{const t=new Date(e.expenseDate).getTime();return t>=start&&t<=end});
 const revenue=filteredSales.reduce((n,s)=>n+s.total,0),costOfGoods=filteredSales.reduce((n,s)=>n+s.totalCost,0),grossProfit=filteredSales.reduce((n,s)=>n+s.grossProfit,0),expenseTotal=filteredExpenses.reduce((n,e)=>n+e.amount,0);
 const trendMap=new Map<string,DashboardTrendPoint>();
 for(const s of filteredSales){const k=dayKey(s.createdAt),p=trendMap.get(k)??{date:k,revenue:0,grossProfit:0,expenses:0,netProfit:0};p.revenue+=s.total;p.grossProfit+=s.grossProfit;trendMap.set(k,p)}
 for(const e of filteredExpenses){const k=dayKey(e.expenseDate),p=trendMap.get(k)??{date:k,revenue:0,grossProfit:0,expenses:0,netProfit:0};p.expenses+=e.amount;trendMap.set(k,p)}
 const trend=[...trendMap.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(p=>({...p,netProfit:p.grossProfit-p.expenses}));
 const productMap=new Map<string,DashboardTopProduct>(); for(const s of filteredSales)for(const i of s.items){const p=productMap.get(i.productId)??{productId:i.productId,productName:i.productName,quantity:0,revenue:0,grossProfit:0};p.quantity+=i.quantity;p.revenue+=i.subtotal;p.grossProfit+=i.subtotal-i.costTotal;productMap.set(i.productId,p)}
 const topProducts=[...productMap.values()].sort((a,b)=>b.revenue-a.revenue).slice(0,5); const customerMap=new Map(customers.map(c=>[c.id,c])); const activeCredits=credits.filter(c=>c.status!=='CANCELLED'&&c.balance>0); const customerReceivables=activeCredits.reduce((n,c)=>n+c.balance,0); const receivables=activeCredits.sort((a,b)=>b.balance-a.balance).slice(0,5).map(c=>{const x=customerMap.get(c.customerId);return{customerId:c.customerId,customerName:x?.name??'Client inconnu',customerPhone:x?.phone,balance:c.balance,originalAmount:c.originalAmount,status:c.status}});
 const stockValue=products.filter(p=>p.active).reduce((n,p)=>n+p.stockQuantity*p.purchasePrice,0);
 return{revenue,costOfGoods,grossProfit,expenses:expenseTotal,netProfit:grossProfit-expenseTotal,salesCount:filteredSales.length,customerReceivables,stockValue,lowStockCount:products.filter(p=>p.active&&p.stockQuantity>0&&p.stockQuantity<=p.minimumStock).length,outOfStockCount:products.filter(p=>p.active&&p.stockQuantity<=0).length,trend,topProducts,recentSales:[...filteredSales].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5).map(s=>({id:s.id,receiptNumber:s.receiptNumber,total:s.total,paymentMethod:s.paymentMethod,createdAt:s.createdAt})),recentExpenses:[...filteredExpenses].sort((a,b)=>b.expenseDate.localeCompare(a.expenseDate)).slice(0,5).map(e=>({id:e.id,label:e.label,amount:e.amount,category:e.category,expenseDate:e.expenseDate})),receivables};
}}}
