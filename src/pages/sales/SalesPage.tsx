import { useEffect, useMemo, useState } from 'react';
import { productRepository } from '../../repositories/productRepository';
import { customerRepository } from '../../repositories/customerRepository';
import { saleRepository } from '../../repositories/saleRepository';
import { saleService } from '../../services/saleService';
import { formatMoney } from '../../utils/stock';
import type { PaymentMethod, Sale } from '../../models/sales';
import type { Product } from '../../models/inventory';
import type { Customer } from '../../models/customer';

type CartLine = { product: Product; quantity: number; unitPrice: number };
const paymentLabels: Record<PaymentMethod, string> = { CASH: 'Espèces', MOBILE_MONEY: 'Mobile Money', CARD: 'Carte', CREDIT: 'Crédit', OTHER: 'Autre' };

export function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaid, setAmountPaid] = useState('0');
  const [customerId, setCustomerId] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [error, setError] = useState('');

  async function refresh() { setProducts(await productRepository.listActive()); setCustomers(await customerRepository.listActive()); }
  useEffect(() => { void refresh(); }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q)).slice(0, 8);
  }, [products, query]);

  const subtotal = cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);
  const paid = Math.max(0, Number(amountPaid) || 0);
  const change = paymentMethod === 'CREDIT' ? 0 : Math.max(0, paid - total);
  const due = Math.max(0, total - paid);

  function addProduct(product: Product) {
    setError('');
    const existing = cart.find((line) => line.product.id === product.id);
    if (existing) setCart(cart.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line));
    else setCart([...cart, { product, quantity: 1, unitPrice: product.sellingPrice }]);
    setQuery('');
  }
  function updateQuantity(productId: string, quantity: number) { if (quantity <= 0) setCart(cart.filter((line) => line.product.id !== productId)); else setCart(cart.map((line) => line.product.id === productId ? { ...line, quantity } : line)); }
  function handlePaymentChange(value: PaymentMethod) { setPaymentMethod(value); if (value !== 'CREDIT') setCustomerId(''); }

  async function checkout() {
    setError('');
    try {
      const sale = await saleService.create({ items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity, unitPrice: line.unitPrice })), discount: discountValue, paymentMethod, amountPaid: paid, customerId: paymentMethod === 'CREDIT' ? customerId : undefined });
      setLastSale(sale); setCart([]); setDiscount('0'); setAmountPaid('0'); setCustomerId(''); setPaymentMethod('CASH'); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de valider la vente.'); }
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1>Caisse</h1>
      {error && <p role="alert">{error}</p>}
      <input autoFocus aria-label="Rechercher un produit" placeholder="Rechercher un produit, SKU ou code-barres..." value={query} onChange={(e) => setQuery(e.target.value)} />
      {suggestions.map((product) => <button key={product.id} onClick={() => addProduct(product)} style={{ display: 'block', width: '100%', padding: 10, textAlign: 'left' }}>{product.name} — {product.stockQuantity} {product.unit} — {formatMoney(product.sellingPrice)}</button>)}
      <section><h2>Panier</h2>{cart.length === 0 && <p>Le panier est vide.</p>}{cart.map((line) => <div key={line.product.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, marginBottom: 8 }}><span>{line.product.name}<br />{formatMoney(line.unitPrice)} / {line.product.unit}</span><input aria-label={`Quantité ${line.product.name}`} type="number" min="0.01" step="any" value={line.quantity} onChange={(e) => updateQuantity(line.product.id, Number(e.target.value))} /><strong>{formatMoney(line.quantity * line.unitPrice)}</strong></div>)}</section>
      <section>
        <p>Sous-total : <strong>{formatMoney(subtotal)}</strong></p>
        <label>Remise <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} /></label>
        <p>Total : <strong>{formatMoney(total)}</strong></p>
        <label>Paiement <select value={paymentMethod} onChange={(e) => handlePaymentChange(e.target.value as PaymentMethod)}>{Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {paymentMethod === 'CREDIT' && <label>Client <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Sélectionner un client</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` — ${customer.phone}` : ''}</option>)}</select></label>}
        <label>Montant payé <input type="number" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} /></label>
        <p>{paymentMethod === 'CREDIT' ? 'Reste à payer' : 'Monnaie'} : <strong>{formatMoney(paymentMethod === 'CREDIT' ? due : change)}</strong></p>
        <button disabled={!cart.length || (paymentMethod === 'CREDIT' && !customerId)} onClick={() => void checkout()}>Valider la vente</button>
      </section>
      {lastSale && <section role="status"><h2>Vente enregistrée</h2><p>Reçu : {lastSale.receiptNumber}</p><p>Total : {formatMoney(lastSale.total)}</p><p>Bénéfice brut : {formatMoney(lastSale.grossProfit)}</p></section>}
      <section><h2>Dernières ventes</h2><p>Historique disponible dans le module Ventes.</p></section>
    </main>
  );
}
