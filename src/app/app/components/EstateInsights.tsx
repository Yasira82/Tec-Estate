'use client';

// TEC Estate (C-114) — Portfolio Insights (Estate Pro). A real, standalone Pro service: an
// aggregate of your OWN properties (read from asset-service). Value with zero population.
// CRITICAL (C-114 §5): NO valuation — counts + lifecycle status only. Estate never asserts
// a property's π value (that is indicative, owned by Analytics). Gated behind live Pro (P5).
import { useEffect, useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { TYPE_META, type PropertyType } from '@/lib/estate/portfolio';

interface Insights {
  total:        number;
  byType:       Record<string, number>;
  byOwnership:  Record<string, number>;
  byLease:      Record<string, number>;
  zoneVerified: number;
  leased:       number;
  listed:       number;
}

const card = { background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}33`, borderRadius: 16, padding: '18px 20px' } as const;

export function EstateInsights() {
  const [pro, setPro] = useState<boolean | null>(null);
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    fetch('/api/bff/estate/insights', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.status === 401 ? null : r.json()))
      .then((j: { pro?: boolean; insights?: Insights } | null) => {
        if (!j) { setPro(false); return; }
        setPro(Boolean(j.pro));
        setData(j.insights ?? null);
      })
      .catch(() => setPro(false));
  }, []);

  if (pro === null) return null;

  const topTypes = data
    ? (Object.entries(data.byType) as [PropertyType, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <section style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>📊 Portfolio insights</h2>
        <span style={{ fontSize: 11, color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}55`, borderRadius: 999, padding: '1px 8px' }}>PRO</span>
      </div>

      {!pro || !data ? (
        <div style={card}>
          <div style={{ color: TEC_COLORS.text, fontWeight: 800, fontSize: 14 }}>🔒 See your portfolio at a glance</div>
          <p style={{ color: TEC_COLORS.subtext, fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
            Estate Pro breaks your properties down by type, ownership, and occupancy — how many are
            leased, listed, or Zone-verified. Your own data — values shown are estimates,
            not official valuations. Upgrade below.
          </p>
        </div>
      ) : data.total === 0 ? (
        <div style={card}>
          <p style={{ color: TEC_COLORS.subtext, fontSize: 13, lineHeight: 1.6 }}>
            Register a property above and your portfolio insights fill in automatically.
          </p>
        </div>
      ) : (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              ['Properties', data.total],
              ['Leased', data.leased],
              ['Listed', data.listed],
              ['✓ Zone', data.zoneVerified],
            ].map(([label, value]) => (
              <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: TEC_COLORS.gold, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                <div style={{ fontSize: 10.5, color: TEC_COLORS.subtext, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {topTypes.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {topTypes.map(([t, n]) => (
                <span key={t} style={{ fontSize: 11, color: TEC_COLORS.subtext, border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 999, padding: '3px 10px' }}>
                  {TYPE_META[t].icon} {TYPE_META[t].label} · <strong style={{ color: TEC_COLORS.gold }}>{n}</strong>
                </span>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, color: TEC_COLORS.subtext, lineHeight: 1.5 }}>
            Counts and lifecycle status only — values shown are estimates.
          </div>
        </div>
      )}
    </section>
  );
}
