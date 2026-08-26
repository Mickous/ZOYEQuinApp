import { describe, expect, it } from 'vitest';

function creditState(originalAmount: number, paidAmount: number) {
  if (!Number.isFinite(originalAmount) || originalAmount <= 0) throw new Error('invalid original amount');
  if (!Number.isFinite(paidAmount) || paidAmount < 0 || paidAmount > originalAmount) throw new Error('invalid payment');
  const balance = originalAmount - paidAmount;
  return { balance, status: balance === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'OPEN' };
}

describe('credit business rules', () => {
  it('creates an open credit', () => expect(creditState(100000, 0)).toEqual({ balance: 100000, status: 'OPEN' }));
  it('creates a partial credit', () => expect(creditState(100000, 30000)).toEqual({ balance: 70000, status: 'PARTIAL' }));
  it('closes a fully paid credit', () => expect(creditState(100000, 100000)).toEqual({ balance: 0, status: 'PAID' }));
  it('rejects overpayment', () => expect(() => creditState(70000, 80000)).toThrow());
  it('rejects negative payment', () => expect(() => creditState(70000, -1)).toThrow());
  it('rejects zero or negative original credit', () => expect(() => creditState(0, 0)).toThrow());
});
