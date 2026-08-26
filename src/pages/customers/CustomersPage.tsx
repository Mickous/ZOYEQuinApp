import { useEffect, useState } from 'react';
import { customerRepository } from '../../repositories/customerRepository';
import { creditService } from '../../services/creditService';
import { formatMoney } from '../../utils/stock';
import type { CreditAccount, CreditPaymentMethod, Customer } from '../../models/customer';

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [credits, setCredits] = useState<CreditAccount[]>([]);
  const [balance, setBalance] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CreditPaymentMethod>('CASH');
  const [error, setError] = useState('');

  async function refresh() { setCustomers(await customerRepository.listActive()); if (selected) await selectCustomer(selected); }
  useEffect(() => { void refresh(); }, []);

  async function selectCustomer(customer: Customer) {
    setSelected(customer);
    setCredits(await customerRepository.listCredits(customer.id));
    setBalance(await customerRepository.getBalance(customer.id));
  }

  async function createCustomer(event: React.FormEvent) {
    event.preventDefault(); setError('');
    try { const customer = await creditService.createCustomer({ name, phone }); setName(''); setPhone(''); await refresh(); await selectCustomer(customer); }
    catch (e) { setError(e instanceof Error ? e.message : 'Impossible de créer le client.'); }
  }

  async function pay(credit: CreditAccount) {
    setError('');
    try { await creditService.recordPayment({ creditAccountId: credit.id, amount: Number(paymentAmount), paymentMethod }); setPaymentAmount(''); await selectCustomer(selected!); }
    catch (e) { setError(e instanceof Error ? e.message : 'Impossible d’enregistrer le remboursement.'); }
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1>Clients & Crédits</h1>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={createCustomer} style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
        <h2>Nouveau client</h2><input required placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} /><input placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} /><button>Créer le client</button>
      </form>
      <section><h2>Clients</h2>{customers.map((customer) => <button key={customer.id} onClick={() => void selectCustomer(customer)} style={{ display: 'block', width: '100%', padding: 12, marginBottom: 8, textAlign: 'left' }}>{customer.name}</button>)}</section>
      {selected && <section><h2>{selected.name}</h2><p>Solde dû : <strong>{formatMoney(balance)}</strong></p><h3>Crédits</h3>{credits.length === 0 && <p>Aucune dette.</p>}{credits.map((credit) => <article key={credit.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8 }}><p>Dette : {formatMoney(credit.originalAmount)} · Reste : <strong>{formatMoney(credit.balance)}</strong></p><p>Statut : {credit.status}</p>{credit.balance > 0 && <div><input type="number" min="0" max={credit.balance} placeholder="Montant" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as CreditPaymentMethod)}><option value="CASH">Espèces</option><option value="MOBILE_MONEY">Mobile Money</option><option value="CARD">Carte</option><option value="OTHER">Autre</option></select><button onClick={() => void pay(credit)}>Enregistrer paiement</button></div>}</article>)}</section>}
    </main>
  );
}
