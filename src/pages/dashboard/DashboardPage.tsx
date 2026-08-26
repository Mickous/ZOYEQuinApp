import { useEffect, useState } from 'react';
import { db } from '../../database/db';
import { createDashboardService, type DashboardMetrics, type DashboardPeriod } from '../../services/dashboardService';

const money = (value: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' FCFA';

type Preset = 'today' | 'week' | 'month';

function periodFor(preset: Preset): DashboardPeriod {
  const now = new Date();
  const start = new Date(now);
  if (preset === 'today') start.setHours(0, 0, 0, 0);
  if (preset === 'week') { start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0); }
  if (preset === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0); }
  return { from: start.toISOString(), to: now.toISOString() };
}

const cardStyle: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.04)' };

export function DashboardPage() {
  const [preset, setPreset] = useState<Preset>('month');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    createDashboardService(db).getMetrics(periodFor(preset)).then((result) => { if (active) setMetrics(result); }).catch((e) => { if (active) setError(e instanceof Error ? e.message : 'Impossible de charger le Dashboard.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [preset]);

  if (loading) return <main style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}><h1>Dashboard</h1><p aria-live="polite">Chargement des indicateurs...</p></main>;
  if (error || !metrics) return <main style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}><h1>Dashboard</h1><p role="alert">{error || 'Aucune donnée disponible.'}</p></main>;

  const attentionCount = metrics.outOfStockCount + metrics.lowStockCount;

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 40px', fontFamily: 'system-ui', background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div><p style={{ margin: 0, fontSize: 13 }}>ZOYEQUINAPP</p><h1 style={{ margin: '4px 0' }}>Tableau de bord</h1><p style={{ margin: 0 }}>La situation de votre boutique en un coup d'œil.</p></div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13 }}>Période<select value={preset} onChange={(e) => setPreset(e.target.value as Preset)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff' }}><option value="today">Aujourd'hui</option><option value="week">7 derniers jours</option><option value="month">Ce mois</option></select></label>
      </header>

      <section aria-label="Indicateurs financiers" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        <article style={cardStyle}><p style={{ margin: 0 }}>Chiffre d'affaires</p><h2 style={{ margin: '8px 0' }}>{money(metrics.revenue)}</h2><small>{metrics.salesCount} vente(s)</small></article>
        <article style={cardStyle}><p style={{ margin: 0 }}>Bénéfice brut</p><h2 style={{ margin: '8px 0' }}>{money(metrics.grossProfit)}</h2><small>Après coût des marchandises</small></article>
        <article style={cardStyle}><p style={{ margin: 0 }}>Bénéfice net</p><h2 style={{ margin: '8px 0' }}>{money(metrics.netProfit)}</h2><small>Dépenses : {money(metrics.expenses)}</small></article>
        <article style={cardStyle}><p style={{ margin: 0 }}>Créances clients</p><h2 style={{ margin: '8px 0' }}>{money(metrics.customerReceivables)}</h2><small>À recouvrer</small></article>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginTop: 12 }} aria-label="Stock et alertes">
        <article style={cardStyle}><p style={{ margin: 0 }}>Valeur du stock</p><h2 style={{ margin: '8px 0' }}>{money(metrics.stockValue)}</h2><small>Au prix d'achat</small></article>
        <article style={{ ...cardStyle, borderColor: attentionCount ? '#f59e0b' : '#e5e7eb' }}><p style={{ margin: 0 }}>À surveiller</p><h2 style={{ margin: '8px 0' }}>{attentionCount}</h2><small>{metrics.lowStockCount} faible(s), {metrics.outOfStockCount} rupture(s)</small></article>
      </section>

      <section aria-label="Lecture rapide" style={{ ...cardStyle, marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>À retenir</h2>
        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
          <li>{metrics.netProfit >= 0 ? `La période est bénéficiaire de ${money(metrics.netProfit)}.` : `La période est déficitaire de ${money(Math.abs(metrics.netProfit))}.`}</li>
          <li>{metrics.customerReceivables > 0 ? `${money(metrics.customerReceivables)} restent à recouvrer auprès des clients.` : 'Aucune créance client en cours.'}</li>
          <li>{metrics.outOfStockCount > 0 ? `${metrics.outOfStockCount} produit(s) sont en rupture et nécessitent une action.` : 'Aucune rupture de stock détectée.'}</li>
        </ul>
      </section>
    </main>
  );
}
