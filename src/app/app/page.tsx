'use client';

// TEC Estate — the Real Estate Operating System of TEC (C-114, extended). Estate
// manages the full property lifecycle: ownership · leasing · management ·
// investment · verification · protection. It coordinates the lifecycle across TEC
// (Life, Connection, Zone, Analytics, FundX, Insure) — it never owns capital,
// title transfer, or valuation truth (C-114 §4/§6). App shell: Home / Portfolio /
// Pro / Settings bottom nav.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePiAuth } from '@yasser172/tec-auth';
import { useMe } from '@/lib-client/hooks/useMe';
import { useTranslation } from '@/lib/i18n';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { InviteCard } from '@/components/referral/InviteCard';
import { EstatePro } from './components/EstatePro';
import { EstateInsights } from './components/EstateInsights';
import { RegisterProperty } from './components/RegisterProperty';
import { BottomNav, type EstTab } from './components/BottomNav';
import { SettingsView } from './components/SettingsView';
import { PILLARS, TYPE_META, OWNERSHIP_META, type Property } from '@/lib/estate/portfolio';

export default function EstateHome() {
  const { user, isLoading } = usePiAuth();
  const me = useMe(); // server-resolved Pi username (Pi Browser hides tec_user from client JS — C-123 §3)
  const { t } = useTranslation();
  const [tab, setTab] = useState<EstTab>('home');

  const piName = me.username ?? user?.piUsername ?? null;
  const name = piName ? `@${piName}` : '';

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

  const title =
    tab === 'portfolio' ? t.estate.nav.portfolio
    : tab === 'pro' ? t.estate.nav.pro
    : tab === 'settings' ? t.estate.nav.settings
    : (isLoading || !name ? t.estate.welcome : t.estate.welcomeName.replace('{name}', name));

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 22px calc(96px + env(safe-area-inset-bottom))' }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>{t.estate.brand}</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEC_COLORS.gold, margin: '6px 0 0' }}>{title}</h1>
          {tab === 'home' && (
            <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '6px 0 0', lineHeight: 1.6 }}>{t.estate.subtitle}</p>
          )}
        </header>

        {tab === 'home' && (
          <>
            {/* The lifecycle pillars — what the Real Estate OS manages. */}
            <section style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>{t.estate.lifecycle}</h2>
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

            <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '24px 0 0', lineHeight: 1.5 }}>{t.estate.footer}</p>
          </>
        )}

        {tab === 'portfolio' && (
          <>
            {/* Register a property — records it in tec-asset-service, gated by a Pi listing fee. */}
            <RegisterProperty onRegistered={() => { void loadPortfolio(); }} />

            {/* Portfolio — live from tec-asset-service, or an honest empty state. */}
            <section style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>{t.estate.portfolio}</h2>
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
                    return <Link key={p.id} href={`/property/${p.id}`} style={propCard}>{inner}</Link>;
                  })}
                </div>
              )}
            </section>

            {/* Portfolio Insights — Estate Pro (own-data; counts + lifecycle, never valuation) */}
            <EstateInsights />
          </>
        )}

        {tab === 'pro' && (
          /* Estate Pro — real Pi U2A payment (a SERVICE subscription, not a property purchase). */
          <EstatePro />
        )}

        {tab === 'settings' && <SettingsView />}
      </div>

      <BottomNav active={tab} onSelect={setTab} />
    </main>
  );
}
