// TEC Estate — property lifecycle detail (C-114, extended). Read-only view of one
// property across the six lifecycle pillars (ownership · leasing · management ·
// investment · verification · protection). No purchase, no title transfer, no
// capital movement — Estate coordinates; the owning systems execute (C-114 §4/§6).
import Link from 'next/link';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { TYPE_META, OWNERSHIP_META } from '@/lib/estate/portfolio';
import { fetchLiveProperty } from '@/lib/estate/fetch-property';

// Real data end-to-end (C-135 §4): a property is read LIVE from tec-asset-service,
// owner-only (P6) — never a fabricated sample. Rendered dynamically (owner-scoped
// no-store fetch).
export const dynamic = 'force-dynamic';

export default async function PropertyPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Live, owner-only property from the asset-service (null if not yours / no session).
  const p = await fetchLiveProperty(id);

  const wrap: React.CSSProperties = {
    minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text,
    padding: '32px 22px', fontFamily: 'system-ui, -apple-system, sans-serif',
  };
  const inner: React.CSSProperties = { maxWidth: 680, margin: '0 auto' };

  if (!p) {
    return (
      <main style={wrap}>
        <div style={inner}>
          <Link href="/app" style={{ fontSize: 13, color: TEC_COLORS.gold, textDecoration: 'none' }}>← Portfolio</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: TEC_COLORS.text, marginTop: 16 }}>Property not found</h1>
          <p style={{ fontSize: 13, color: TEC_COLORS.subtext }}>
            No property <code>{id}</code> you can view. Properties are visible only
            to their owner — sign in with the owning account (P6).
          </p>
        </div>
      </main>
    );
  }

  const facets: { icon: string; label: string; value: string }[] = [
    { icon: '📜', label: 'Ownership',    value: p.lifecycle.ownership },
    { icon: '🔑', label: 'Leasing',      value: p.lifecycle.leasing },
    { icon: '🛠️', label: 'Management',   value: p.lifecycle.management },
    { icon: '📈', label: 'Investment',   value: p.lifecycle.investment },
    { icon: '🛡️', label: 'Verification', value: p.lifecycle.verification },
    { icon: '☂️', label: 'Protection',   value: p.lifecycle.protection },
  ];

  return (
    <main style={wrap}>
      <div style={inner}>
        <Link href="/app" style={{ fontSize: 13, color: TEC_COLORS.gold, textDecoration: 'none' }}>← Portfolio</Link>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>
              {TYPE_META[p.type].icon} {TYPE_META[p.type].label} · {OWNERSHIP_META[p.ownership]}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: TEC_COLORS.text, margin: '4px 0 0' }}>{p.title}</h1>
            <div style={{ fontSize: 13, color: TEC_COLORS.gold, marginTop: 2 }}>{p.location}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: p.zoneVerified ? '#0a0800' : TEC_COLORS.text, background: p.zoneVerified ? `linear-gradient(135deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})` : 'transparent', border: p.zoneVerified ? 'none' : `1px solid ${TEC_COLORS.subtext}66`, borderRadius: 999, padding: '6px 12px', whiteSpace: 'nowrap' }}>
            {p.zoneVerified ? '🛡️ Zone Verified' : 'Verification pending'}
          </div>
        </div>

        <p style={{ fontSize: 13, color: TEC_COLORS.subtext, margin: '12px 0 0' }}>
          <strong style={{ color: TEC_COLORS.text }}>Indicative value:</strong> {p.indicativeValue} — from Analytics, not a valuation (C-114 §5).
        </p>

        <h2 style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.text, margin: '26px 0 10px' }}>Lifecycle</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {facets.map((f) => (
            <div key={f.label} style={{ background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: TEC_COLORS.text }}>{f.icon} {f.label}</div>
              <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 5, lineHeight: 1.5 }}>{f.value}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '22px 0 0', lineHeight: 1.5 }}>
          Recorded in tec-asset-service (C-114 §12) — Estate presents it, never owns it.
          Estate coordinates the lifecycle — it never processes a full property
          purchase in Pi, transfers legal title, or holds capital (C-114 §6).
          Financing → FundX · verification → Zone · protection → Insure ·
          payments → tec-payment-service · title → external legal.
        </p>
      </div>
    </main>
  );
}
