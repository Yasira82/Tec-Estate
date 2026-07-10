import { describe, it, expect } from 'vitest';
import { PORTFOLIO, PILLARS, getProperty } from '@/lib/estate/portfolio';

describe('TEC Estate — Real Estate OS portfolio (C-114, read-only)', () => {
  it('exposes the six lifecycle pillars', () => {
    const titles = PILLARS.map((p) => p.title);
    for (const t of ['Ownership', 'Leasing', 'Management', 'Investment', 'Verification', 'Protection']) {
      expect(titles).toContain(t);
    }
  });

  it('every property has a complete lifecycle (all six facets present)', () => {
    for (const p of PORTFOLIO) {
      const lc = p.lifecycle;
      for (const facet of ['ownership', 'leasing', 'management', 'investment', 'verification', 'protection'] as const) {
        expect(lc[facet]).toBeTruthy();
      }
    }
  });

  it('value is indicative-only (string label, not a numeric valuation — C-114 §5/§6)', () => {
    for (const p of PORTFOLIO) {
      expect(typeof p.indicativeValue).toBe('string');
      expect(p.indicativeValue.toLowerCase()).toContain('indicative');
    }
  });

  it('getProperty fails closed for an unknown id', () => {
    expect(getProperty('nope')).toBeNull();
    expect(getProperty('downtown-apt-12b')?.title).toBe('Downtown Apartment 12B');
  });
});
