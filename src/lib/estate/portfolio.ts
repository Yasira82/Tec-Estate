// TEC Estate — the Real Estate OS data model (C-114, extended). This is a
// READ-ONLY sample portfolio that demonstrates the property LIFECYCLE Estate
// coordinates: ownership · leasing · management · investment · verification ·
// protection. It moves no capital, transfers no title, and computes no valuation
// (C-114 §4/§6) — those stay with their owning systems (payment-service, FundX,
// external legal, Analytics, Zone, Insure). Everything here is a demo preview.

export type PropertyType = 'apartment' | 'villa' | 'land' | 'office' | 'shop' | 'warehouse' | 'farm';
export type OwnershipType = 'owned' | 'shared' | 'investment' | 'rental';
export type LeaseStatus = 'owner-occupied' | 'leased' | 'vacant' | 'listed';

// The six lifecycle pillars Estate coordinates (each references the OWNING system).
export interface Lifecycle {
  ownership:    string;   // ownership status (title truth = external legal)
  leasing:      string;   // lease/rent status (payments settle via payment-service)
  management:   string;   // maintenance / bills / documents
  investment: string; // financing / pooled investment → FundX
  verification: string; // property/owner/agent verification → Zone
  protection:   string;   // insurance → Insure
}

export interface Property {
  id:          string;
  title:       string;
  type:        PropertyType;
  ownership:   OwnershipType;
  location:    string;
  leaseStatus: LeaseStatus;
  // Indicative only — NEVER presented as valuation truth (Analytics, C-114 §5).
  indicativeValue: string;
  zoneVerified: boolean;
  lifecycle:   Lifecycle;
}

export const TYPE_META: Record<PropertyType, { icon: string; label: string }> = {
  apartment: { icon: '🏢', label: 'Apartment' },
  villa:     { icon: '🏡', label: 'Villa' },
  land:      { icon: '🌄', label: 'Land' },
  office:    { icon: '🏬', label: 'Office' },
  shop:      { icon: '🏪', label: 'Shop' },
  warehouse: { icon: '🏭', label: 'Warehouse' },
  farm:      { icon: '🚜', label: 'Farm' },
};

export const OWNERSHIP_META: Record<OwnershipType, string> = {
  owned:      'Owned',
  shared:     'Shared ownership',
  investment: 'Investment',
  rental:     'Rental',
};

// The lifecycle pillars, for the OS home shell.
export const PILLARS = [
  { icon: '📜', title: 'Ownership',    body: 'Owned, shared, investment, and rental properties in one portfolio.' },
  { icon: '🔑', title: 'Leasing',      body: 'Lease contracts, monthly rent, renewals, and reminders.' },
  { icon: '🛠️', title: 'Management',   body: 'Maintenance, bills, utilities, insurance, and documents.' },
  { icon: '📈', title: 'Investment', body: 'Finance a purchase or co-invest in property — via FundX.' },
  { icon: '🛡️', title: 'Verification', body: 'Property, owner, and agent verification — via Zone.' },
  { icon: '☂️', title: 'Protection',   body: 'Insure the property — via Insure. Estate coordinates, never holds capital.' },
];

// Sample portfolio (demo). Read-only.
export const PORTFOLIO: Property[] = [
  {
    id: 'downtown-apt-12b',
    title: 'Downtown Apartment 12B',
    type: 'apartment',
    ownership: 'owned',
    location: 'City Center',
    leaseStatus: 'owner-occupied',
    indicativeValue: '~ 42,000 π (indicative)',
    zoneVerified: true,
    lifecycle: {
      ownership:    'Owner-occupied · sole title (title truth via external legal).',
      leasing:      'Not leased — owner residence.',
      management:   'Maintenance up to date · 2 documents on file.',
      investment:   'No active financing. Eligible for a FundX equity-release pool (concept).',
      verification: 'Zone Verified — property + owner evidence confirmed.',
      protection:   'Home insurance active (via Insure — coordinated, not held here).',
    },
  },
  {
    id: 'seaside-villa-7',
    title: 'Seaside Villa 7',
    type: 'villa',
    ownership: 'rental',
    location: 'Coast Road',
    leaseStatus: 'leased',
    indicativeValue: '~ 180,000 π (indicative)',
    zoneVerified: true,
    lifecycle: {
      ownership:    'Owned + rented out to a verified tenant.',
      leasing:      'Leased · 12-month contract · rent settled via payment-service.',
      management:   'Pool + garden maintenance scheduled · utility bills tracked.',
      investment:   'Rental yield indicative only (Analytics) — not a guaranteed return.',
      verification: 'Zone Verified — property + tenant KYC via tec-kyc-service.',
      protection:   'Landlord insurance active (via Insure).',
    },
  },
  {
    id: 'north-land-parcel',
    title: 'North Land Parcel',
    type: 'land',
    ownership: 'investment',
    location: 'North District',
    leaseStatus: 'vacant',
    indicativeValue: '~ 95,000 π (indicative)',
    zoneVerified: false,
    lifecycle: {
      ownership:    'Co-owned investment parcel (shared ownership).',
      leasing:      'Vacant — held for development/appreciation.',
      management:   'No structures · title documents pending verification.',
      investment:   'Candidate for a FundX co-investment pool (concept — no capital moved here).',
      verification: 'Verification pending in Zone — not yet confirmed.',
      protection:   'No active policy.',
    },
  },
];

export const getProperty = (id: string): Property | null =>
  PORTFOLIO.find((p) => p.id === id) ?? null;

// ── asset-service integration (C-114 §12) ───────────────────────────────────
// A property is stored as an Asset in tec-asset-service (Estate never owns the
// record — it presents it). We tag property assets with metadata.kind==='property'
// and carry the display fields in metadata. This maps one asset-service Asset
// into the Estate Property shape for the portfolio view.

export interface AssetRecord {
  id?:       string;
  slug?:     string;
  ownerId?:  string;
  category?: string;
  status?:   string;
  metadata?: Record<string, unknown> | null;
}

const asStr = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() ? v : fallback;

const PROPERTY_TYPES: PropertyType[] = ['apartment', 'villa', 'land', 'office', 'shop', 'warehouse', 'farm'];
const OWNERSHIP_TYPES: OwnershipType[] = ['owned', 'shared', 'investment', 'rental'];
const LEASE_STATUSES: LeaseStatus[] = ['owner-occupied', 'leased', 'vacant', 'listed'];

/** True if an asset-service Asset represents an Estate property. */
export const isPropertyAsset = (a: AssetRecord): boolean =>
  (a?.metadata?.kind === 'property') || (a?.category === 'REAL_ESTATE');

/** Map an asset-service Asset (kind=property) → the Estate Property shape. */
export const mapAssetToProperty = (a: AssetRecord): Property => {
  const m = (a.metadata ?? {}) as Record<string, unknown>;
  const type = PROPERTY_TYPES.includes(m.type as PropertyType) ? (m.type as PropertyType) : 'apartment';
  const ownership = OWNERSHIP_TYPES.includes(m.ownership as OwnershipType) ? (m.ownership as OwnershipType) : 'owned';
  const leaseStatus = LEASE_STATUSES.includes(m.leaseStatus as LeaseStatus) ? (m.leaseStatus as LeaseStatus) : 'owner-occupied';
  const lc = (m.lifecycle ?? {}) as Partial<Lifecycle>;
  return {
    id:          asStr(a.slug ?? a.id, 'property'),
    title:       asStr(m.title, a.slug ?? 'Property'),
    type,
    ownership,
    location:    asStr(m.location, '—'),
    leaseStatus,
    indicativeValue: asStr(m.indicativeValue, 'Value indicative — set by Analytics'),
    zoneVerified: m.zoneVerified === true,
    lifecycle: {
      ownership:    asStr(lc.ownership, 'Ownership recorded in tec-asset-service (title truth via external legal).'),
      leasing:      asStr(lc.leasing, 'No lease on record.'),
      management:   asStr(lc.management, 'No management records yet.'),
      investment:   asStr(lc.investment, 'No active financing.'),
      verification: asStr(lc.verification, a.status === 'ACTIVE' ? 'Ownership active; Zone verification pending.' : 'Verification pending.'),
      protection:   asStr(lc.protection, 'No active policy.'),
    },
  };
};
