import { describe, it, expect } from 'vitest';
import {
  PORTFOLIO, PILLARS, getProperty, isPropertyAsset, mapAssetToProperty,
} from '@/lib/estate/portfolio';

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

  it('isPropertyAsset keeps only property-kind assets (asset-service; C-114 → Deployment Status → Property records)', () => {
    expect(isPropertyAsset({ metadata: { kind: 'property' } })).toBe(true);
    expect(isPropertyAsset({ category: 'REAL_ESTATE' })).toBe(true);
    expect(isPropertyAsset({ category: 'DOMAIN', metadata: { kind: 'domain' } })).toBe(false);
    expect(isPropertyAsset({})).toBe(false);
  });

  it('mapAssetToProperty maps an asset-service Asset into the Estate shape (with safe defaults)', () => {
    const p = mapAssetToProperty({
      slug: 'flat-9a', status: 'ACTIVE', category: 'REAL_ESTATE',
      metadata: { kind: 'property', title: 'Flat 9A', type: 'apartment', ownership: 'owned', location: 'Cairo', zoneVerified: true },
    });
    expect(p.id).toBe('flat-9a');
    expect(p.title).toBe('Flat 9A');
    expect(p.type).toBe('apartment');
    expect(p.zoneVerified).toBe(true);
    // Missing lifecycle → safe defaults, never undefined (never blank in the UI).
    expect(p.lifecycle.ownership).toBeTruthy();
    // An unknown type coerces to a valid default, not a crash.
    const q = mapAssetToProperty({ metadata: { kind: 'property', type: 'spaceship' } });
    expect(['apartment']).toContain(q.type);
  });

  it('NO fixture claims a Zone verification', () => {
    // A fixture carrying a verification badge is the platform verifying itself,
    // which C-120 and C-108 §4 both forbid. These rows are not rendered today —
    // and that is exactly why it matters: Explorer's seed was dead too, until
    // someone wired it and eight invented businesses appeared in production with
    // six "Verified" badges among them. A fixture is one import away from real.
    expect(PORTFOLIO.every((x) => x.zoneVerified === false)).toBe(true);
  });
});
