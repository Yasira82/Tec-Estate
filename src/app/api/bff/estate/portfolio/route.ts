import { NextRequest, NextResponse } from 'next/server';
import {
  PILLARS, isPropertyAsset, mapAssetToProperty, type AssetRecord,
} from '@/lib/estate/portfolio';

// GET /api/bff/estate/portfolio — the user's property portfolio (C-114 §12).
// Estate does NOT own property records — tec-asset-service does. This BFF reads
// the caller's OWN assets from the asset-service (server-side, identity from the
// session cookie — never the body, P6), keeps the property-kind ones, and maps
// them into the Estate view. Estate presents; it never mutates asset truth here.
//
// Real data end-to-end (C-135 §4): the lifecycle PILLARS are Estate's definitional
// model (shown always); the portfolio is the user's OWN data. With no session, no
// gateway, or an upstream error the source is 'unavailable' with an empty portfolio
// (honest state) — never a fabricated sample. A live read (even empty — a real user
// with no properties yet) returns source:'live'.
const GW = process.env.API_GATEWAY_URL ?? '';

const getUserId = (req: NextRequest): string => {
  try {
    const u = JSON.parse(decodeURIComponent(req.cookies.get('tec_user')?.value ?? ''));
    return u?.id ?? u?.sub ?? u?.piId ?? '';
  } catch { return ''; }
};

const unavailable = () =>
  NextResponse.json(
    { source: 'unavailable', readOnly: true, pillars: PILLARS, portfolio: [], count: 0 },
    { headers: { 'Cache-Control': 'no-store' } },
  );

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  const token  = req.cookies.get('tec_access_token')?.value ?? '';
  // No gateway or no session → honest unavailable (no fabricated portfolio).
  if (!GW || !userId) return unavailable();

  try {
    const res = await fetch(`${GW}/api/assets/user/${encodeURIComponent(userId)}`, {
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
        'x-request-id':  crypto.randomUUID(),
        'x-user-id':     userId,
        ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
      },
      cache: 'no-store',
    });
    if (!res.ok) return unavailable();
    const body = await res.json().catch(() => ({}));
    const assets: AssetRecord[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
    const portfolio = assets.filter(isPropertyAsset).map(mapAssetToProperty);
    // A real user with no properties yet is a live, honest empty portfolio.
    return NextResponse.json(
      { source: 'live', readOnly: true, pillars: PILLARS, portfolio, count: portfolio.length },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    );
  } catch {
    return unavailable();   // upstream error → honest empty, never a fabricated portfolio
  }
}
