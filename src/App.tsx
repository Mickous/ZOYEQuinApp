import { useState } from 'react';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { SalesPage } from './pages/sales/SalesPage';
import { CustomersPage } from './pages/customers/CustomersPage';

type Screen = 'inventory' | 'sales' | 'customers';

export default function App() {
  const [screen, setScreen] = useState<Screen>('inventory');

  return (
    <>
      <nav aria-label="Navigation principale" style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid #ddd' }}>
        <button type="button" onClick={() => setScreen('inventory')} aria-current={screen === 'inventory' ? 'page' : undefined}>Produits & Stock</button>
        <button type="button" onClick={() => setScreen('sales')} aria-current={screen === 'sales' ? 'page' : undefined}>Caisse</button>
        <button type="button" onClick={() => setScreen('customers')} aria-current={screen === 'customers' ? 'page' : undefined}>Clients & Crédits</button>
      </nav>
      {screen === 'inventory' && <InventoryPage />}
      {screen === 'sales' && <SalesPage />}
      {screen === 'customers' && <CustomersPage />}
    </>
  );
}
