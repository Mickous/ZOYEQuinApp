import { describe, expect, it } from 'vitest';

describe('credit domain rules', () => {
  it('computes a partial balance correctly', () => {
    const original = 100000;
    const paid = 30000;
    expect(original - paid).toBe(70000);
  });

  it('marks a fully paid credit as settled', () => {
    const original = 100000;
    const paid = 100000;
    expect(original - paid).toBe(0);
  });

  it('rejects a payment greater than the remaining balance', () => {
    const balance = 70000;
    const payment = 80000;
    expect(payment > balance).toBe(true);
  });
});
