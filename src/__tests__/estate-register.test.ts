import { describe, it, expect } from 'vitest';
import {
  LISTING_FEE, slugifyProperty, buildPropertyMetadata,
  PROPERTY_TYPE_OPTIONS, OWNERSHIP_OPTIONS, type PropertyDraft,
} from '@/lib/estate/register';
import { isPropertyAsset, mapAssetToProperty } from '@/lib/estate/portfolio';

describe('TEC Estate — register a property (C-114 §7/§12)', () => {
  it('the listing fee is a small SERVICE fee, not the property value (C-114 §6)', () => {
    expect(typeof LISTING_FEE).toBe('number');
    expect(LISTING_FEE).toBeGreaterThan(0);
    expect(LISTING_FEE).toBeLessThan(100);   // a service fee, never a property price
  });

  it('slugifyProperty is url-safe, bounded, and unique across calls', () => {
    const a = slugifyProperty('Downtown Apartment 12B!!');
    const b = slugifyProperty('Downtown Apartment 12B!!');
    expect(a).toMatch(/^[a-z0-9-]+$/);
    expect(a.startsWith('downtown-apartment-12b')).toBe(true);
    expect(a).not.toBe(b);                    // random suffix → unique constraint safe
  });

  it('slugifyProperty falls back to "property" for empty/symbol titles', () => {
    expect(slugifyProperty('!!!').startsWith('property-')).toBe(true);
    expect(slugifyProperty('').startsWith('property-')).toBe(true);
  });

  it('buildPropertyMetadata tags kind=property and never self-asserts verification', () => {
    const draft: PropertyDraft = { title: '  Flat 9A  ', type: 'apartment', ownership: 'owned', location: '  Cairo  ' };
    const m = buildPropertyMetadata(draft);
    expect(m.kind).toBe('property');
    expect(m.title).toBe('Flat 9A');          // trimmed
    expect(m.location).toBe('Cairo');         // trimmed
    expect(m.zoneVerified).toBe(false);       // verification comes from Zone, not here
    expect(typeof m.registeredAt).toBe('string');
  });

  it('metadata written by register reads back as a property asset (round-trip with portfolio)', () => {
    const m = buildPropertyMetadata({ title: 'Villa 7', type: 'villa', ownership: 'rental', location: 'Coast' });
    const asset = { slug: slugifyProperty('Villa 7'), status: 'ACTIVE', category: 'DIGITAL_ASSET', metadata: m };
    expect(isPropertyAsset(asset)).toBe(true);
    const p = mapAssetToProperty(asset);
    expect(p.title).toBe('Villa 7');
    expect(p.type).toBe('villa');
    expect(p.ownership).toBe('rental');
    expect(p.zoneVerified).toBe(false);
  });

  it('the option lists cover every property + ownership type', () => {
    expect(PROPERTY_TYPE_OPTIONS.map((o) => o.value)).toEqual(
      expect.arrayContaining(['apartment', 'villa', 'land', 'office', 'shop', 'warehouse', 'farm']),
    );
    expect(OWNERSHIP_OPTIONS.map((o) => o.value)).toEqual(
      expect.arrayContaining(['owned', 'shared', 'investment', 'rental']),
    );
  });
});
