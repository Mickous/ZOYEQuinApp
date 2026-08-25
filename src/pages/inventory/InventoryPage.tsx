import { useEffect, useMemo, useState } from 'react';
import { productRepository } from '../../repositories/productRepository';
import { stockMovementRepository } from '../../repositories/stockMovementRepository';
import { inventoryService } from '../../services/inventoryService';
import type { Product, StockMovement } from '../../models/inventory';

const emptyForm = {
  name: '', unit: 'pièce', purchasePrice: '0', sellingPrice: '0', stockQuantity: '0', minimumStock: '0',
};

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  async function refresh() {
    setProducts(await productRepository.listActive());
  }

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [products, query]);

  async function selectProduct(product: Product) {
    setSelected(product);
    setMovements(await stockMovementRepository.listByProduct(product.id));
  }

  async function createProduct(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const product = await productRepository.create({
        name: form.name,
        unit: form.unit,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity),
        minimumStock: Number(form.minimumStock),
        active: true,
      });
      if (product.stockQuantity > 0) {
        await inventoryService.addStock({ productId: product.id, quantity: product.stockQuantity, reason: 'Stock initial' });
      }
      setForm(emptyForm);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création.');
    }
  }

  async function move(type: 'IN' | 'OUT') {
    if (!selected) return;
    const raw = window.prompt(type === 'IN' ? 'Quantité à ajouter' : 'Quantité à retirer');
    const quantity = Number(raw);
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    try {
      const updated = type === 'IN'
        ? await inventoryService.addStock({ productId: selected.id, quantity, reason: type === 'IN' ? 'Entrée manuelle' : 'Sortie manuelle' })
        : await inventoryService.removeStock({ productId: selected.id, quantity, reason: 'Sortie manuelle' });
      await selectProduct(updated);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de stock.');
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1>Produits & Stock</h1>
      {error && <p role="alert">{error}</p>}
      <input aria-label="Rechercher un produit" placeholder="Rechercher..." value={query} onChange={(e) => setQuery(e.target.value)} />

      <form onSubmit={createProduct} style={{ display: 'grid', gap: 8, margin: '20px 0' }}>
        <h2>Nouveau produit</h2>
        <input required placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="Unité" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <input type="number" min="0" placeholder="Prix achat" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
        <input type="number" min="0" placeholder="Prix vente" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
        <input type="number" min="0" placeholder="Stock initial" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
        <input type="number" min="0" placeholder="Stock minimum" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} />
        <button type="submit">Créer le produit</button>
      </form>

      <section>
        {filtered.map((product) => (
          <button key={product.id} onClick={() => void selectProduct(product)} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: 12 }}>
            <strong>{product.name}</strong><br />
            Stock : {product.stockQuantity} {product.unit} — Vente : {product.sellingPrice.toLocaleString('fr-FR')} FCFA
          </button>
        ))}
      </section>

      {selected && (
        <section>
          <h2>{selected.name}</h2>
          <p>Stock actuel : <strong>{selected.stockQuantity} {selected.unit}</strong></p>
          <button onClick={() => void move('IN')}>Entrée</button>{' '}
          <button onClick={() => void move('OUT')}>Sortie</button>
          <h3>Historique</h3>
          {movements.map((m) => <p key={m.id}>{new Date(m.createdAt).toLocaleString('fr-FR')} — {m.quantityDelta > 0 ? '+' : ''}{m.quantityDelta} — {m.reason}</p>)}
        </section>
      )}
    </main>
  );
}
