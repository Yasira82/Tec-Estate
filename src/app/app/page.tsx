'use client';

// TEC Estate — the Real Estate Operating System of TEC (C-114, extended). Estate
// manages the full property lifecycle: ownership · leasing · management ·
// investment · verification · protection. It coordinates the lifecycle across TEC
// (Life, Connection, Zone, Analytics, FundX, Insure) — it never owns capital,
// title transfer, or valuation truth (C-114 §4/§6).
//
// The portfolio is served by /api/bff/estate/portfolio, which reads the caller's
// OWN property assets from tec-asset-service (C-114 §12) — Estate presents, it
// never owns the record. Real data end-to-end (C-135 §4): the lifecycle pillars
// are definitional; the portfolio is the user's own data (honest empty when there
// are none / no session — never a fabricated sample).
import Link from 'next/link';
import { InviteCard } from '@/components/referral/InviteCard';
import { useEffect, useState } from 'react';
import { usePiAuth } from '@yasser172/tec-auth';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { EstatePro } from './components/EstatePro';
import { EstateInsights } from './components/EstateInsights';
import { RegisterProperty } from './components/RegisterProperty';
import { PILLARS, TYPE_META, OWNERSHIP_META, type Property } from '@/lib/estate/portfolio';

export default function EstateHome() {
  const { user, isLoading } = usePiAuth();
  const name = user?.piUsername ? `@${user.piUsername}` : 'there';

  const [portfolio, setPortfolio] = useState<Property[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  const loadPortfolio = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/bff/estate/portfolio', { credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (data && data.source === 'live' && Array.isArray(data.portfolio)) {
        setPortfolio(data.portfolio as Property[]);
        setStatus('ready');
      } else {
        setPortfolio([]);
        setStatus('unavailable');
      }
    } catch { setPortfolio([]); setStatus('unavailable'); }
  };

  useEffect(() => { void loadPortfolio(); }, []);

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
            Everything about your property, in one place —
            <strong style={{ color: TEC_COLORS.text }}> track ownership, leasing, value, and upkeep</strong>
            {' '}as your needs change.
          </p>
        </header>

        {/* Estate Pro — real Pi U2A payment (a SERVICE subscription, not a property purchase). */}
        <EstatePro />

        {/* Register a property — records it in tec-asset-service, gated by a Pi listing fee. */}
        <RegisterProperty onRegistered={() => { void loadPortfolio(); }} />

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

        {/* Portfolio — live from tec-asset-service, or an honest empty state. */}
        <section style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>Your Portfolio</h2>
            <span style={{ fontSize: 11, color: status === 'ready' ? TEC_COLORS.gold : TEC_COLORS.subtext, border: `1px solid ${status === 'ready' ? TEC_COLORS.gold + '55' : TEC_COLORS.gold + '33'}`, borderRadius: 999, padding: '2px 10px' }}>
              {status === 'loading' ? 'loading…' : status === 'ready' ? 'live' : 'sign in'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '6px 0 14px', lineHeight: 1.5 }}>
            Your properties, all in one place. Values shown are estimates.
          </p>

          {status === 'unavailable' && (
            <div style={{ ...card, textAlign: 'center', padding: '28px 16px', color: TEC_COLORS.subtext, fontSize: 13, lineHeight: 1.6 }}>
              Sign in with Pi to see your property portfolio. Register a property to add one —
              it&apos;ll appear here.
            </div>
          )}
          {status === 'ready' && portfolio.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: '28px 16px', color: TEC_COLORS.subtext, fontSize: 13, lineHeight: 1.6 }}>
              No properties yet. Register one above to start managing its lifecycle across TEC.
            </div>
          )}

          {status === 'ready' && portfolio.length > 0 && (
          <div style={{ display: 'grid', gap: 10 }}>
            {portfolio.map((p) => {
              const inner = (
                <>
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
                </>
              );
              // Both sample and live properties have a /property/[id] detail page
              // (live is fetched owner-only from tec-asset-service, C-114 §12).
              return <Link key={p.id} href={`/property/${p.id}`} style={propCard}>{inner}</Link>;
            })}
          </div>
          )}
        </section>

        {/* Portfolio Insights — Estate Pro (own-data; counts + lifecycle, never valuation) */}
        <EstateInsights />

        <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '24px 0 0', lineHeight: 1.5 }}>
          Estate helps you list, manage, and track your property. It doesn&apos;t process full
          property sales or transfer legal title — those go through the proper legal channels.
        </p>
        <InviteCard />
      </div>
    </main>
  );
}
