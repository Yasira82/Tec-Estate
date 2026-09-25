import { describe, it, expect } from 'vitest';
import {
  LISTING_FEE, encodePropertyProduct, isPropertyProduct, PROPERTY_PRODUCT_PREFIX,
  PROPERTY_TYPE_OPTIONS, OWNERSHIP_OPTIONS, type PropertyDraft,
} from '@/lib/estate/register';
import { isPropertyAsset, mapAssetToProperty } from '@/lib/estate/portfolio';

describe('TEC Estate — register a property (C-114 §7/§12)', () => {
  it('the listing fee is a small SERVICE fee, not the property value (C-114 §6)', () => {
    expect(typeof LISTING_FEE).toBe('number');
    expect(LISTING_FEE).toBeGreaterThan(0);
    expect(LISTING_FEE).toBeLessThan(100);   // a service fee, never a property price
  });

  // The property travels INSIDE the payment, so asset-service can record it from the
  // payment's event — a Hub (Mode 1) round trip used to lose the form, and the 3π with it.
  it('encodes the property into the payment product id — and back, the way asset-service reads it', () => {
    const draft: PropertyDraft = { title: '  Flat 9A  ', type: 'apartment', ownership: 'owned', location: '  Cairo  ' };
    const product = encodePropertyProduct(draft);
    expect(product.startsWith(PROPERTY_PRODUCT_PREFIX)).toBe(true);
    const decoded = JSON.parse(Buffer.from(product.slice(PROPERTY_PRODUCT_PREFIX.length), 'base64').toString('utf8'));
    expect(decoded).toEqual({ t: 'Flat 9A', y: 'apartment', o: 'owned', l: 'Cairo' });   // trimmed
  });

  it('survives an Arabic title — UTF-8, where btoa() alone would throw', () => {
    const product = encodePropertyProduct({ title: 'فيلا الشروق', type: 'villa', ownership: 'owned', location: 'القاهرة' });
    const decoded = JSON.parse(Buffer.from(product.slice(PROPERTY_PRODUCT_PREFIX.length), 'base64').toString('utf8'));
    expect(decoded.t).toBe('فيلا الشروق');
    expect(decoded.l).toBe('القاهرة');
  });

  it('tells a property payment from Estate Pro and from nothing', () => {
    expect(isPropertyProduct(encodePropertyProduct({ title: 'Villa 7', type: 'villa', ownership: 'rental', location: 'Coast' }))).toBe(true);
    expect(isPropertyProduct('estate_pro_monthly')).toBe(false);
    expect(isPropertyProduct(null)).toBe(false);
  });

  it('the record asset-service writes reads back as a property (round-trip with portfolio)', () => {
    // The metadata tec-asset-service PurchaseService.registerProperty writes.
    const metadata = { kind: 'property', title: 'Villa 7', type: 'villa', ownership: 'rental',
      location: 'Coast', zoneVerified: false, registeredAt: '2026-09-25T00:00:00.000Z', paymentId: 'p1' };
    const asset = { slug: 'villa-7-p1', status: 'ACTIVE', category: 'REAL_ESTATE', metadata };
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
