import { useState } from 'react';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { SalesPage } from './pages/sales/SalesPage';
import { CustomersPage } from './pages/customers/CustomersPage';

type Screen = 'dashboard' | 'inventory' | 'sales' | 'customers';

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');

  return (
    <>
      <nav aria-label="Navigation principale" style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid #ddd', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setScreen('dashboard')} aria-current={screen === 'dashboard' ? 'page' : undefined}>Dashboard</button>
        <button type="button" onClick={() => setScreen('inventory')} aria-current={screen === 'inventory' ? 'page' : undefined}>Produits & Stock</button>
        <button type="button" onClick={() => setScreen('sales')} aria-current={screen === 'sales' ? 'page' : undefined}>Caisse</button>
        <button type="button" onClick={() => setScreen('customers')} aria-current={screen === 'customers' ? 'page' : undefined}>Clients & Crédits</button>
      </nav>
      {screen === 'dashboard' && <DashboardPage />}
      {screen === 'inventory' && <InventoryPage />}
      {screen === 'sales' && <SalesPage />}
      {screen === 'customers' && <CustomersPage />}
    </>
  );
}
