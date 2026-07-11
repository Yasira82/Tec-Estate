// TEC Estate — register a property (C-114 §7 service fees). Registering a property
// records it as an Asset in tec-asset-service (category DIGITAL_ASSET + metadata
// kind='property'); Estate NEVER owns the record (C-114 §12). It is gated by a
// small Pi LISTING FEE — a service payment, NOT the property value (C-114 §6).
import type { PropertyType, OwnershipType } from './portfolio';

// Listing fee in π — a SERVICE fee (C-114 §7), never the property value (§6).
export const LISTING_FEE = 3;

export interface PropertyDraft {
  title:     string;
  type:      PropertyType;
  ownership: OwnershipType;
  location:  string;
}

/** Stable, unique slug for the asset-service record (unique constraint). */
export const slugifyProperty = (title: string): string => {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'property';
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
};

/** The metadata written onto the property Asset — read back by isPropertyAsset. */
export const buildPropertyMetadata = (d: PropertyDraft): Record<string, unknown> => ({
  kind:         'property',
  title:        d.title.trim(),
  type:         d.type,
  ownership:    d.ownership,
  location:     d.location.trim(),
  zoneVerified: false,           // verification comes from Zone, never self-asserted
  registeredAt: new Date().toISOString(),
});

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
