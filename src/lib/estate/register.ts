// TEC Estate — register a property (C-114 §7 service fees). A property is recorded as a
// REAL_ESTATE asset in tec-asset-service; Estate never owns the record (C-114 → Deployment
// Status → Property records). Registering costs a small Pi LISTING FEE — a service
// payment, never the property value (C-114 §4/§6).
//
// The property travels INSIDE the payment: its product id is `estate-property:<base64>`.
// asset-service reads it from `payment.completed.v1` and records the property itself
// (PurchaseService), so a registration started from the Hub (Mode 1) is no longer lost
// on the way back, and a closed tab after paying no longer means paid-and-nothing.
import type { PropertyType, OwnershipType } from './portfolio';

// Listing fee in π — a SERVICE fee (C-114 §7), never the property value (§6).
// asset-service enforces the same amount (ESTATE_LISTING_FEE_PI).
export const LISTING_FEE = 3;

export interface PropertyDraft {
  title:     string;
  type:      PropertyType;
  ownership: OwnershipType;
  location:  string;
}

export const PROPERTY_PRODUCT_PREFIX = 'estate-property:';

/**
 * The payment's product id for registering `d`. UTF-8 then base64 — a title may be
 * Arabic, and btoa() alone throws on anything outside Latin-1. asset-service decodes it
 * with the same encoding and validates every field (purchase-product.ts).
 */
export const encodePropertyProduct = (d: PropertyDraft): string => {
  const json  = JSON.stringify({ t: d.title.trim(), y: d.type, o: d.ownership, l: d.location.trim() });
  let binary  = '';
  new TextEncoder().encode(json).forEach((b) => { binary += String.fromCharCode(b); });
  return PROPERTY_PRODUCT_PREFIX + btoa(binary);
};

export const isPropertyProduct = (productId: string | null | undefined): boolean =>
  String(productId ?? '').startsWith(PROPERTY_PRODUCT_PREFIX);

export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa',     label: 'Villa' },
  { value: 'land',      label: 'Land' },
  { value: 'office',    label: 'Office' },
  { value: 'shop',      label: 'Shop' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'farm',      label: 'Farm' },
];

export const OWNERSHIP_OPTIONS: { value: OwnershipType; label: string }[] = [
  { value: 'owned',      label: 'Owned' },
  { value: 'shared',     label: 'Shared ownership' },
  { value: 'investment', label: 'Investment' },
  { value: 'rental',     label: 'Rental' },
];
