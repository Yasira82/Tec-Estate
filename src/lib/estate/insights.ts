// TEC Estate (C-114) — Portfolio Insights. A genuine standalone Pro service: an aggregate
// of the caller's OWN properties (read from asset-service — Estate never owns the record).
// Value with zero population (it's your own portfolio). CRITICAL (C-114 §5): Estate NEVER
// asserts valuation — insights are COUNTS + lifecycle status only, never a summed π value.
import type { Property, PropertyType, OwnershipType, LeaseStatus } from './portfolio';

const GW = process.env.API_GATEWAY_URL ?? '';

export interface PortfolioInsights {
  total:        number;
  byType:       Record<string, number>;
  byOwnership:  Record<string, number>;
  byLease:      Record<string, number>;
  zoneVerified: number;   // presented from Zone — never minted (C-120)
  leased:       number;   // income-generating (leaseStatus === 'leased')
  listed:       number;   // on the market
}

const TYPES:      PropertyType[]  = ['apartment', 'villa', 'land', 'office', 'shop', 'warehouse', 'farm'];
const OWNERSHIPS: OwnershipType[] = ['owned', 'shared', 'investment', 'rental'];
const LEASES:     LeaseStatus[]   = ['owner-occupied', 'leased', 'vacant', 'listed'];

/** Aggregate the caller's OWN properties. Counts + lifecycle status ONLY — never valuation. */
export function computePortfolioInsights(props: Property[]): PortfolioInsights {
  const byType:      Record<string, number> = Object.fromEntries(TYPES.map((t) => [t, 0]));
  const byOwnership: Record<string, number> = Object.fromEntries(OWNERSHIPS.map((o) => [o, 0]));
  const byLease:     Record<string, number> = Object.fromEntries(LEASES.map((l) => [l, 0]));
  let zoneVerified = 0, leased = 0, listed = 0;

  for (const p of props) {
    if (p.type in byType)           byType[p.type]           = (byType[p.type] ?? 0) + 1;
    if (p.ownership in byOwnership)  byOwnership[p.ownership] = (byOwnership[p.ownership] ?? 0) + 1;
    if (p.leaseStatus in byLease)    byLease[p.leaseStatus]   = (byLease[p.leaseStatus] ?? 0) + 1;
    if (p.zoneVerified)              zoneVerified++;
    if (p.leaseStatus === 'leased')  leased++;
    if (p.leaseStatus === 'listed')  listed++;
  }

  return { total: props.length, byType, byOwnership, byLease, zoneVerified, leased, listed };
}

/** The caller's LIVE Estate-Pro entitlement — from commerce (Subscription owner, C-47).
 *  Estate never STORES billing (P5); it reflects it to gate insights. Any failure → false. */
export async function resolveProStatus(token: string | null): Promise<boolean> {
  if (!GW || !token) return false;
  try {
    const res = await fetch(`${GW}/api/commerce/subscriptions/status`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
        'x-request-id': crypto.randomUUID(),
        ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
      },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    // commerce returns { data: { subscription: {...} } } — unwrap the subscription
    // (a flat shape is also tolerated). Missing this returned FREE for real Pro users.
    const root = (d.data ?? d) as Record<string, unknown>;
    const s = ((root.subscription ?? root) ?? {}) as Record<string, unknown>;
    const plan = String(s.plan ?? s.tier ?? '').toUpperCase();
    const active  = s.isActive === true || s.active === true || (plan !== '' && plan !== 'FREE');
    const expired = s.isExpired === true;
    const end     = s.current_period_end ?? s.currentPeriodEnd ?? s.expires_at;
    const notExpired = !expired && (!end || new Date(String(end)).getTime() > Date.now());
    return active && notExpired && plan !== '' && plan !== 'FREE';
  } catch { return false; }
}
