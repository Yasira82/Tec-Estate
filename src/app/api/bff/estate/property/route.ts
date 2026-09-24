import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { slugifyProperty, buildPropertyMetadata } from '@/lib/estate/register';

// POST /api/bff/estate/property — register a property (C-114 §7 / §12).
// A property is recorded as an Asset in tec-asset-service — Estate NEVER owns the
// record. The write is gated by a Pi LISTING FEE (a SERVICE payment, never the
// property value, C-114 §6): the client pays first, then POSTs the completed
// payment id as `payment_id`; the asset-service uses it as the provision
// `transactionId` (proof-of-payment). Identity comes from the session cookie —
// NEVER the body (P6). CSRF is enforced in middleware; this route only forwards.
const GW = process.env.API_GATEWAY_URL ?? '';

const getUserId = (req: NextRequest): string => {
  try {
    const u = JSON.parse(decodeURIComponent(req.cookies.get('tec_user')?.value ?? ''));
    return u?.id ?? u?.sub ?? u?.piId ?? '';
  } catch { return ''; }
};

const gwHeaders = (token: string, userId: string) => ({
  'Content-Type':  'application/json',
  Authorization:   `Bearer ${token}`,
  'x-request-id':  crypto.randomUUID(),
  'x-user-id':     userId,
  ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
});

const RegisterSchema = z.object({
  title:      z.string().min(2).max(80),
  type:       z.enum(['apartment', 'villa', 'land', 'office', 'shop', 'warehouse', 'farm']),
  ownership:  z.enum(['owned', 'shared', 'investment', 'rental']),
  location:   z.string().min(2).max(80),
  // The completed listing-fee payment id (payment-service internal UUID) — becomes
  // the asset-service provision transactionId. Required: no free property records.
  payment_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  if (!GW) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  const token  = req.cookies.get('tec_access_token')?.value ?? '';
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = RegisterSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }
  const { title, type, ownership, location, payment_id } = parsed.data;

  // A property is a first-class REAL_ESTATE asset in tec-asset-service (C-114 → Deployment Status → Property records).
  // metadata.kind='property' is kept as a belt-and-suspenders tag — isPropertyAsset()
  // matches on either the category or the tag, so the portfolio reads it back both ways.
  const body = {
    transactionId: payment_id,
    userId,                                    // owner = session identity, never the body
    category:      'REAL_ESTATE',
    slug:          slugifyProperty(title),
    metadata:      buildPropertyMetadata({ title, type, ownership, location }),
  };

  try {
    const res  = await fetch(`${GW}/api/assets/provision`, {
      method: 'POST', headers: gwHeaders(token, userId), body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to register property' }, { status: 500 });
  }
}
