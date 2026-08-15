'use client';

// Register a property (C-114 §7 / §12). Registering records the property as an
// Asset in tec-asset-service — Estate never owns the record; it presents it.
// The write is gated by a Pi LISTING FEE: a SERVICE payment, NOT the property
// value (C-114 §4/§6). Estate never processes full property value in Pi.
//
// Flow (standalone / Mode 2): pay the listing fee → get the payment id back →
// POST /api/bff/estate/property with payment_id as proof-of-payment; the
// asset-service uses it as the provision transactionId. ADR-007 dual-mode is
// preserved: if the Pi session is foreign (Hub navigation), we hand the fee to
// the Hub modal (Mode 1) rather than touch window.Pi.
import { useEffect, useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import {
  isHubNavigation,
  redirectToHubPayment,
  createPaymentRecord,
  createU2APayment,
} from '@/lib/pi-payment';
import {
  LISTING_FEE,
  PROPERTY_TYPE_OPTIONS,
  OWNERSHIP_OPTIONS,
  type PropertyDraft,
} from '@/lib/estate/register';
import type { PropertyType, OwnershipType } from '@/lib/estate/portfolio';

const ITEM_ID = 'estate_listing_fee';
const MEMO    = 'TEC Estate — property listing fee';

const asText = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.error === 'string')   return o.error;
    try { return JSON.stringify(v); } catch { return 'Something went wrong.'; }
  }
  return v == null ? '' : String(v);
};

type Status = 'idle' | 'creating' | 'paying' | 'registering' | 'success' | 'error';

export function RegisterProperty({ onRegistered }: { onRegistered?: () => void }) {
  const [open,   setOpen]   = useState(false);
  const [piReady, setPiReady] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const [title,     setTitle]     = useState('');
  const [type,      setType]      = useState<PropertyType>('apartment');
  const [ownership, setOwnership] = useState<OwnershipType>('owned');
  const [location,  setLocation]  = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as { __TEC_PI_READY?: boolean }).__TEC_PI_READY) { setPiReady(true); return; }
    const h = () => setPiReady(true);
    window.addEventListener('tec-pi-ready', h, { once: true });
    return () => window.removeEventListener('tec-pi-ready', h);
  }, []);

  const draft = (): PropertyDraft => ({ title: title.trim(), type, ownership, location: location.trim() });
  const valid = title.trim().length >= 2 && location.trim().length >= 2;
  const busy  = status === 'creating' || status === 'paying' || status === 'registering';

  // Provision the property in tec-asset-service, keyed by the paid listing fee.
  const registerProperty = async (paymentId: string): Promise<boolean> => {
    setStatus('registering');
    try {
      const res = await fetch('/api/bff/estate/property', {
        method: 'POST', credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': document.cookie.match(/(?:^|;\s*)tec_csrf=([^;]*)/)?.[1] ?? '',
        },
        body: JSON.stringify({ ...draft(), payment_id: paymentId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(asText(err?.error) || 'Property registered payment succeeded but recording failed. Contact support with your payment id.');
        return false;
      }
      setStatus('success');
      onRegistered?.();
      return true;
    } catch (err) {
      setStatus('error');
      setMessage(asText(err) || 'Could not record the property. Please try again.');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (busy || !valid) return;

    // ADR-007 (C-76): Hub navigation / foreign Pi session → Mode 1 (Hub modal) for
    // the listing fee. Standalone registration completes in the Pi Browser app.
    if (isHubNavigation() || (window as { __TEC_PI_FOREIGN_SESSION?: boolean }).__TEC_PI_FOREIGN_SESSION
        || !(window as { Pi?: unknown }).Pi || !piReady) {
      redirectToHubPayment({ amount: LISTING_FEE, itemId: ITEM_ID, memo: MEMO });
      return;
    }

    // Mode 2 — standalone: pay the listing fee, then record the property.
    setStatus('creating');
    setMessage('');
    try {
      const internalId = await createPaymentRecord(LISTING_FEE, ITEM_ID, MEMO);
      if (!internalId) {
        setStatus('error');
        setMessage('Could not start the listing-fee payment. Please sign in again and retry.');
        return;
      }
      setStatus('paying');
      const result = await createU2APayment(LISTING_FEE, MEMO, { item_id: ITEM_ID, kind: 'property' }, internalId);
      if (result.success && result.status === 'completed') {
        await registerProperty(result.paymentId ?? internalId);
      } else if (result.status === 'cancelled') {
        setStatus('idle');
      } else {
        setStatus('error');
        setMessage(asText(result.message) || 'Payment failed. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(asText(err) || 'Payment failed. Please try again.');
    }
  };

  const card: React.CSSProperties = {
    background:   TEC_COLORS.surface,
    border:       `1px solid ${TEC_COLORS.gold}33`,
    borderRadius: 16,
    padding:      20,
    marginTop:    24,
  };
  const field: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10, marginTop: 6,
    background: TEC_COLORS.bg, color: TEC_COLORS.text,
    border: `1px solid ${TEC_COLORS.gold}22`, fontSize: 14,
  };
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: TEC_COLORS.subtext };

  if (status === 'success') {
    return (
      <div style={{ ...card, borderColor: `${TEC_COLORS.success}66` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.success }}>✅ Property registered</div>
        <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 6, lineHeight: 1.5 }}>
          Added — it now appears in your portfolio.
          Verification is requested separately via Zone.
        </div>
        <button
          onClick={() => { setStatus('idle'); setTitle(''); setLocation(''); setOpen(false); }}
          style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10, background: 'transparent', color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}55`, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Register another
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.gold }}>➕ Register a property</div>
          <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 4, lineHeight: 1.5 }}>
            Add a property to your portfolio. A {LISTING_FEE}π listing fee — a service fee, not the property price.
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          style={{ padding: '10px 16px', borderRadius: 12, background: `linear-gradient(135deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})`, color: '#0a0800', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Register
        </button>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.gold }}>➕ Register a property</div>

      <div style={{ marginTop: 14 }}>
        <div style={label}>Title</div>
        <input style={field} value={title} maxLength={80} placeholder="e.g. Downtown Apartment 12B"
          onChange={(e) => setTitle(e.target.value)} disabled={busy} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div>
          <div style={label}>Type</div>
          <select style={field} value={type} disabled={busy}
            onChange={(e) => setType(e.target.value as PropertyType)}>
            {PROPERTY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <div style={label}>Ownership</div>
          <select style={field} value={ownership} disabled={busy}
            onChange={(e) => setOwnership(e.target.value as OwnershipType)}>
            {OWNERSHIP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={label}>Location</div>
        <input style={field} value={location} maxLength={80} placeholder="e.g. City Center"
          onChange={(e) => setLocation(e.target.value)} disabled={busy} />
      </div>

      <button
        onClick={() => { void handleSubmit(); }}
        disabled={busy || !valid}
        style={{
          marginTop: 16, width: '100%', padding: '12px 16px', borderRadius: 12,
          background: (busy || !valid) ? '#333' : `linear-gradient(135deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})`,
          color: (busy || !valid) ? '#888' : '#0a0800',
          border: 'none', fontSize: 14, fontWeight: 800,
          cursor: (busy || !valid) ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'creating' ? 'Preparing…'
          : status === 'paying' ? 'Confirm in Pi…'
          : status === 'registering' ? 'Recording…'
          : `Pay ${LISTING_FEE}π listing fee & register`}
      </button>

      <div style={{ fontSize: 11, color: TEC_COLORS.subtext, marginTop: 10, lineHeight: 1.5 }}>
        The listing fee is a service payment, not the property price. Estate doesn&apos;t
        transfer legal title — that goes through the proper legal channels. Verification
        is earned, not self-declared.
      </div>

      {status === 'error' && (
        <div style={{ fontSize: 12, color: TEC_COLORS.error, marginTop: 10 }}>{message}</div>
      )}

      <button
        onClick={() => setOpen(false)}
        disabled={busy}
        style={{ marginTop: 10, padding: '6px 0', background: 'transparent', color: TEC_COLORS.subtext, border: 'none', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer' }}
      >
        Cancel
      </button>
    </div>
  );
}
