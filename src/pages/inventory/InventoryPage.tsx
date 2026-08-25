import { useEffect, useMemo, useState } from 'react';
import { productRepository } from '../../repositories/productRepository';
import { stockMovementRepository } from '../../repositories/stockMovementRepository';
import { categoryRepository } from '../../repositories/categoryRepository';
import { categoryService } from '../../services/categoryService';
import { inventoryService } from '../../services/inventoryService';
import { StockMovementModal } from '../../components/inventory/StockMovementModal';
import { formatMoney, getStockStatus, getStockValue } from '../../utils/stock';
import type { Category, Product, StockMovement, StockMovementType } from '../../models/inventory';

const emptyForm = { name: '', unit: 'pièce', sku: '', barcode: '', categoryId: '', purchasePrice: '0', sellingPrice: '0', stockQuantity: '0', minimumStock: '0' };

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [modal, setModal] = useState<StockMovementType | null>(null);
  const [error, setError] = useState('');

  async function refresh() {
    setProducts(await productRepository.listActive());
    setCategories(await categoryRepository.listActive());
  }
  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q));
  }, [products, query]);

  async function selectProduct(product: Product) {
    setSelected(product);
    setMovements(await stockMovementRepository.listByProduct(product.id));
  }

  function beginEdit(product: Product) {
    setSelected(product);
    setEditing(true);
    setForm({ name: product.name, unit: product.unit, sku: product.sku ?? '', barcode: product.barcode ?? '', categoryId: product.categoryId ?? '', purchasePrice: String(product.purchasePrice), sellingPrice: String(product.sellingPrice), stockQuantity: String(product.stockQuantity), minimumStock: String(product.minimumStock) });
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault(); setError('');
    try {
      const payload = { name: form.name, unit: form.unit, sku: form.sku || undefined, barcode: form.barcode || undefined, categoryId: form.categoryId || undefined, purchasePrice: Number(form.purchasePrice), sellingPrice: Number(form.sellingPrice), minimumStock: Number(form.minimumStock) };
      if (editing && selected) {
        const updated = await productRepository.update(selected.id, payload);
        await selectProduct(updated);
      } else {
        const product = await productRepository.create({ ...payload, stockQuantity: 0, active: true });
        const initialStock = Number(form.stockQuantity);
        if (initialStock > 0) await inventoryService.addStock({ productId: product.id, quantity: initialStock, reason: 'Stock initial' });
      }
      setForm(emptyForm); setEditing(false); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur lors de l’enregistrement.'); }
  }

  async function deactivateSelected() {
    if (!selected || !window.confirm(`Désactiver « ${selected.name} » ?`)) return;
    try { await productRepository.deactivate(selected.id); setSelected(null); setMovements([]); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Impossible de désactiver le produit.'); }
  }

  async function createCategory() {
    const name = window.prompt('Nom de la catégorie');
    if (!name) return;
    try { await categoryService.create(name); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de créer la catégorie.'); }
  }

  async function submitMovement(quantity: number, reason: string, delta?: number) {
    if (!selected) return;
    const updated = modal === 'IN' ? await inventoryService.addStock({ productId: selected.id, quantity, reason }) : modal === 'OUT' ? await inventoryService.removeStock({ productId: selected.id, quantity, reason }) : await inventoryService.adjustStock({ productId: selected.id, delta: delta ?? quantity, reason });
    await selectProduct(updated); await refresh();
  }

  const selectedCategory = selected?.categoryId ? categories.find((c) => c.id === selected.categoryId) : undefined;

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1>Produits & Stock</h1>
      {error && <p role="alert">{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input aria-label="Rechercher un produit" placeholder="Rechercher par nom, SKU ou code-barres..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="button" onClick={() => void createCategory()}>+ Catégorie</button>
      </div>

      <form onSubmit={saveProduct} style={{ display: 'grid', gap: 8, margin: '20px 0' }}>
        <h2>{editing ? 'Modifier le produit' : 'Nouveau produit'}</h2>
        <input required placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="Unité" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input placeholder="Code-barres" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Sans catégorie</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input type="number" min="0" placeholder="Prix achat" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
        <input type="number" min="0" placeholder="Prix vente" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
        {!editing && <input type="number" min="0" placeholder="Stock initial" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />}
        <input type="number" min="0" placeholder="Stock minimum" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} />
        <button type="submit">{editing ? 'Enregistrer les modifications' : 'Créer le produit'}</button>
        {editing && <button type="button" onClick={() => { setEditing(false); setForm(emptyForm); }}>Annuler</button>}
      </form>

      <section>{filtered.map((product) => { const status = getStockStatus(product); return (
        <button key={product.id} onClick={() => void selectProduct(product)} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: 12 }}>
          <strong>{product.name}</strong> — {status === 'out' ? 'Rupture' : status === 'low' ? 'Stock faible' : 'Stock OK'}<br />
          Stock : {product.stockQuantity} {product.unit} — Valeur : {formatMoney(getStockValue(product))}
        </button>
      ); })}</section>

      {selected && <section>
        <h2>{selected.name}</h2>
        <p>{selectedCategory?.name ?? 'Sans catégorie'} · {selected.sku ?? 'Sans SKU'}</p>
        <p>Stock : <strong>{selected.stockQuantity} {selected.unit}</strong> · Valeur : <strong>{formatMoney(getStockValue(selected))}</strong></p>
        <button onClick={() => setModal('IN')}>Entrée</button>{' '}<button onClick={() => setModal('OUT')}>Sortie</button>{' '}<button onClick={() => setModal('ADJUSTMENT')}>Ajuster</button>{' '}<button onClick={() => beginEdit(selected)}>Modifier</button>{' '}<button onClick={() => void deactivateSelected()}>Désactiver</button>
        <h3>Historique</h3>
        {movements.map((m) => <p key={m.id}>{new Date(m.createdAt).toLocaleString('fr-FR')} — {m.quantityDelta > 0 ? '+' : ''}{m.quantityDelta} — {m.reason}</p>)}
      </section>}
      {modal && selected && <StockMovementModal type={modal} onClose={() => setModal(null)} onSubmit={submitMovement} />}
    </main>
  );
}
