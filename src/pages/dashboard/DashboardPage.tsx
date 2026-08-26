import { useEffect, useState } from 'react';
import { db } from '../../database/db';
import { createDashboardService, type DashboardMetrics, type DashboardPeriod } from '../../services/dashboardService';

const money = (value: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' FCFA';

type Preset = 'today' | 'week' | 'month';

function periodFor(preset: Preset): DashboardPeriod {
  const now = new Date();
  const start = new Date(now);
  if (preset === 'today') start.setHours(0, 0, 0, 0);
  if (preset === 'week') start.setDate(now.getDate() - 6), start.setHours(0, 0, 0, 0);
  if (preset === 'month') start.setDate(1), start.setHours(0, 0, 0, 0);
  return { from: start.toISOString(), to: now.toISOString() };
}

export function DashboardPage() {
  const [preset, setPreset] = useState<Preset>('month');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    createDashboardService(db).getMetrics(periodFor(preset)).then((result) => { if (active) setMetrics(result); }).catch((e) => { if (active) setError(e instanceof Error ? e.message : 'Impossible de charger le Dashboard.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [preset]);

  if (loading) return <main style={{ padding: 20 }}><h1>Dashboard</h1><p>Chargement...</p></main>;
  if (error || !metrics) return <main style={{ padding: 20 }}><h1>Dashboard</h1><p role="alert">{error || 'Aucune donnée.'}</p></main>;

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div><h1>Dashboard</h1><p>Vue rapide de la santé de la boutique.</p></div>
        <label>Période <select value={preset} onChange={(e) => setPreset(e.target.value as Preset)}><option value="today">Aujourd'hui</option><option value="week">7 derniers jours</option><option value="month">Ce mois</option></select></label>
      </header>
      <section aria-label="Indicateurs financiers" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <article><span>Chiffre d'affaires</span><h2>{money(metrics.revenue)}</h2><small>{metrics.salesCount} vente(s)</small></article>
        <article><span>Bénéfice brut</span><h2>{money(metrics.grossProfit)}</h2><small>Après coût des marchandises</small></article>
        <article><span>Bénéfice net</span><h2>{money(metrics.netProfit)}</h2><small>Dépenses : {money(metrics.expenses)}</small></article>
        <article><span>Créances clients</span><h2>{money(metrics.customerReceivables)}</h2><small>Montant restant à recouvrer</small></article>
      </section>
      <section aria-label="Situation du stock" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginTop: 16 }}>
        <article><span>Valeur du stock</span><h2>{money(metrics.stockValue)}</h2></article>
        <article><span>Stock faible</span><h2>{metrics.lowStockCount}</h2><small>Produit(s) à surveiller</small></article>
        <article><span>Ruptures</span><h2>{metrics.outOfStockCount}</h2><small>Produit(s) indisponible(s)</small></article>
      </section>
      <section style={{ marginTop: 24 }}><h2>Lecture rapide</h2><ul><li>{metrics.netProfit >= 0 ? 'La période est bénéficiaire.' : 'La période est déficitaire.'}</li><li>{metrics.customerReceivables > 0 ? `Il reste ${money(metrics.customerReceivables)} à recouvrer auprès des clients.` : 'Aucune créance client en cours.'}</li><li>{metrics.outOfStockCount > 0 ? `${metrics.outOfStockCount} produit(s) sont en rupture.` : 'Aucune rupture de stock détectée.'}</li></ul></section>
    </main>
  );
}
