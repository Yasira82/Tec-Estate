import { NextRequest, NextResponse } from 'next/server';
import {
  PORTFOLIO, PILLARS, isPropertyAsset, mapAssetToProperty, type AssetRecord,
} from '@/lib/estate/portfolio';

// GET /api/bff/estate/portfolio — the user's property portfolio (C-114 §12).
// Estate does NOT own property records — tec-asset-service does. This BFF reads
// the caller's OWN assets from the asset-service (server-side, identity from the
// session cookie — never the body, P6), keeps the property-kind ones, and maps
// them into the Estate view. Estate presents; it never mutates asset truth here.
//
// Fail-SAFE: with no session, no gateway, an upstream error, or an empty result,
// it returns the curated read-only sample so /app is never blank (source:'sample').
// A real portfolio returns source:'live'.
const GW = process.env.API_GATEWAY_URL ?? '';

const getUserId = (req: NextRequest): string => {
  try {
    const u = JSON.parse(decodeURIComponent(req.cookies.get('tec_user')?.value ?? ''));
    return u?.id ?? u?.sub ?? u?.piId ?? '';
  } catch { return ''; }
};

const sample = () =>
  NextResponse.json(
    { source: 'sample', readOnly: true, pillars: PILLARS, portfolio: PORTFOLIO, count: PORTFOLIO.length },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  const token  = req.cookies.get('tec_access_token')?.value ?? '';
  // No gateway or no session → the demo sample (public, read-only).
  if (!GW || !userId) return sample();

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
    if (!res.ok) return sample();
    const body = await res.json().catch(() => ({}));
    const assets: AssetRecord[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
    const portfolio = assets.filter(isPropertyAsset).map(mapAssetToProperty);
    if (portfolio.length === 0) return sample();   // real user, no properties yet → demo
    return NextResponse.json(
      { source: 'live', readOnly: true, pillars: PILLARS, portfolio, count: portfolio.length },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    );
  } catch {
    return sample();   // upstream error → never blank
  }
}
