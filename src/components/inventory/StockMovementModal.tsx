import { useState } from 'react';
import type { StockMovementType } from '../../models/inventory';

type Props = {
  type: StockMovementType;
  onClose: () => void;
  onSubmit: (quantity: number, reason: string, delta?: number) => Promise<void>;
};

export function StockMovementModal({ type, onClose, onSubmit }: Props) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [delta, setDelta] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    const value = type === 'ADJUSTMENT' ? Number(delta) : Number(quantity);
    if (!Number.isFinite(value) || value === 0 || (type !== 'ADJUSTMENT' && value < 0)) {
      setError(type === 'ADJUSTMENT' ? 'Indiquez une variation différente de zéro.' : 'Indiquez une quantité valide.');
      return;
    }
    if (!reason.trim()) { setError('Le motif est obligatoire.'); return; }
    setBusy(true);
    try {
      await onSubmit(value, reason, type === 'ADJUSTMENT' ? value : undefined);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’enregistrer le mouvement.');
    } finally { setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="stock-modal-title">
      <div>
        <h2 id="stock-modal-title">{type === 'IN' ? 'Entrée de stock' : type === 'OUT' ? 'Sortie de stock' : 'Ajustement de stock'}</h2>
        <form onSubmit={submit}>
          {type === 'ADJUSTMENT' ? (
            <input autoFocus type="number" step="any" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="Variation : +10 ou -3" />
          ) : (
            <input autoFocus type="number" min="0.01" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantité" />
          )}
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif" />
          {error && <p role="alert">{error}</p>}
          <button type="button" onClick={onClose} disabled={busy}>Annuler</button>
          <button type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </form>
      </div>
    </div>
  );
}
