import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// POST /api/bff/estate/property — the follow-up after the listing fee is paid.
//
// It no longer creates the property. The property travelled inside the payment
// (`estate-property:<base64>` as its product id), and tec-asset-service records it from
// the payment's own `payment.completed.v1` — the one creation path, whether or not this
// call ever arrives. This route asks asset-service to CLAIM the payment for the session
// user:
//   200  registered (now, or already)
//   202  paid, not confirmed yet — it will appear in the portfolio shortly
//   403  the payment is someone else's
//   409  the payment was for something else, or refused (e.g. underpaid)
// Identity comes from the session, never the body (P6). CSRF is enforced in middleware.
const GW = process.env.API_GATEWAY_URL ?? '';

const getUserId = (req: NextRequest): string => {
  try {
    const u = JSON.parse(decodeURIComponent(req.cookies.get('tec_user')?.value ?? ''));
    return u?.id ?? u?.sub ?? u?.piId ?? '';
  } catch { return ''; }
};

const ClaimSchema = z.object({
  // Our payment id (Mode 2) or the one the Hub returned (Mode 1) — asset-service
  // resolves either; the receipt, not this id, is the proof.
  payment_id: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  if (!GW) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  const token  = req.cookies.get('tec_access_token')?.value ?? '';
  const userId = getUserId(req);
  if (!token || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = ClaimSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${GW}/api/assets/purchases/${encodeURIComponent(parsed.data.payment_id)}/claim`,
      {
        method:  'POST',
        cache:   'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
          'x-request-id': crypto.randomUUID(),
          ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
        },
        body: JSON.stringify({ userId }),
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Not lost: asset-service records the property from the payment's event.
    return NextResponse.json({ status: 'pending' }, { status: 202 });
  }
}
