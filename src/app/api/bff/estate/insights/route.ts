import { NextRequest, NextResponse } from 'next/server';
import { isPropertyAsset, mapAssetToProperty, type AssetRecord } from '@/lib/estate/portfolio';
import { computePortfolioInsights, resolveProStatus } from '@/lib/estate/insights';

// GET /api/bff/estate/insights — Estate Pro "Portfolio Insights" (C-114). An aggregate of
// the caller's OWN properties (read from asset-service — Estate never owns the record).
// Identity is the `tec_user` session cookie server-side — NEVER the body (P6). The
// aggregate is gated behind the caller's LIVE subscription (P5 — Estate never stores
// billing); a non-Pro gets `{ pro: false }` for a teaser. COUNTS + lifecycle status only,
// never a summed valuation (C-114 §5 — valuation is indicative, owned by Analytics).
const GW = process.env.API_GATEWAY_URL ?? '';

const getUserId = (req: NextRequest): string => {
  try {
    const u = JSON.parse(decodeURIComponent(req.cookies.get('tec_user')?.value ?? ''));
    return u?.id ?? u?.sub ?? u?.piId ?? '';
  } catch { return ''; }
};

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  const token  = req.cookies.get('tec_access_token')?.value ?? null;
  if (!GW || !userId || !token) return NextResponse.json({ pro: false, insights: null }, { status: 401 });

  const isPro = await resolveProStatus(token);
  if (!isPro) return NextResponse.json({ pro: false, insights: null }, { headers: { 'Cache-Control': 'private, max-age=15' } });

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
    if (!res.ok) return NextResponse.json({ pro: true, insights: null });
    const body = await res.json().catch(() => ({}));
    const assets: AssetRecord[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
    const properties = assets.filter(isPropertyAsset).map(mapAssetToProperty);
    return NextResponse.json(
      { pro: true, insights: computePortfolioInsights(properties) },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    );
  } catch {
    return NextResponse.json({ pro: true, insights: null });   // honest — never fabricated
  }
}
