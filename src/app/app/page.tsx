'use client';

// TEC Estate — the Real Estate Operating System of TEC (C-114, extended). Estate
// manages the full property lifecycle: ownership · leasing · management ·
// investment · verification · protection. It coordinates the lifecycle across TEC
// (Life, Connection, Zone, Analytics, FundX, Insure) — it never owns capital,
// title transfer, or valuation truth (C-114 §4/§6). V0 shows the OS pillars +
// Estate Pro + a READ-ONLY sample portfolio (demo).
import Link from 'next/link';
import { usePiAuth } from '@yasser172/tec-auth';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { EstatePro } from './components/EstatePro';
import { PORTFOLIO, PILLARS, TYPE_META, OWNERSHIP_META } from '@/lib/estate/portfolio';

export default function EstateHome() {
  const { user, isLoading } = usePiAuth();
  const name = user?.piUsername ? `@${user.piUsername}` : 'there';

  const card: React.CSSProperties = {
    background:   TEC_COLORS.surface,
    border:       `1px solid ${TEC_COLORS.gold}22`,
    borderRadius: 12,
    padding:      14,
  };
  const propCard: React.CSSProperties = { ...card, display: 'block', textDecoration: 'none' };

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text, padding: '32px 22px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>TEC Estate · Real Estate OS</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEC_COLORS.gold, margin: '6px 0 0' }}>
            {isLoading ? 'Welcome' : `Welcome, ${name}`}
          </h1>
          <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '6px 0 0', lineHeight: 1.6 }}>
            Not just a marketplace — the operating system for your property.
            <strong style={{ color: TEC_COLORS.text }}> “Where do you live, and what do you own or manage?”</strong>
            Estate coordinates the full lifecycle across TEC (C-114).
          </p>
        </header>

        {/* Estate Pro — real Pi U2A payment (a SERVICE subscription, not a property purchase). */}
        <EstatePro />

        {/* The lifecycle pillars — what the Real Estate OS manages. */}
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>The lifecycle</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
            {PILLARS.map((p) => (
              <div key={p.title} style={card}>
                <div style={{ fontSize: 18 }}>{p.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: TEC_COLORS.text, marginTop: 6 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 4, lineHeight: 1.5 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Sample portfolio — read-only demo of the lifecycle per property. */}
        <section style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>Your Portfolio</h2>
            <span style={{ fontSize: 11, color: TEC_COLORS.subtext, border: `1px solid ${TEC_COLORS.gold}33`, borderRadius: 999, padding: '2px 10px' }}>sample · read-only</span>
          </div>
          <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '6px 0 14px', lineHeight: 1.5 }}>
            A demo portfolio showing the lifecycle per property. Values are indicative
            (Analytics), never valuation truth. Tap a property to open its lifecycle.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {PORTFOLIO.map((p) => (
              <Link key={p.id} href={`/property/${p.id}`} style={propCard}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: TEC_COLORS.text }}>
                    {TYPE_META[p.type].icon} {p.title}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: p.zoneVerified ? TEC_COLORS.gold : TEC_COLORS.subtext, border: `1px solid ${p.zoneVerified ? TEC_COLORS.gold + '55' : TEC_COLORS.subtext + '55'}`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                    {p.zoneVerified ? '🛡️ Zone Verified' : 'Unverified'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: TEC_COLORS.gold, marginTop: 3 }}>
                  {TYPE_META[p.type].label} · {OWNERSHIP_META[p.ownership]} · {p.location}
                </div>
                <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 5 }}>{p.indicativeValue}</div>
              </Link>
            ))}
          </div>
        </section>

        <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '24px 0 0', lineHeight: 1.5 }}>
          Estate coordinates the lifecycle; it never processes a full property purchase
          in Pi, transfers legal title, holds capital, or asserts valuation (C-114 §4/§6).
          Capital → payment-service + FundX · title → external legal · verification → Zone ·
          market data → Analytics · protection → Insure.
        </p>
      </div>
    </main>
  );
}
