import { NextResponse } from 'next/server';
import { PORTFOLIO, PILLARS } from '@/lib/estate/portfolio';

// GET /api/bff/estate/portfolio — public, read-only sample portfolio (C-114).
// A demo of the property lifecycle Estate coordinates. No capital, no title, no
// valuation truth (C-114 §6). No auth/gateway needed — it's a static demo surface.
export async function GET() {
  return NextResponse.json(
    { mode: 'sample', readOnly: true, pillars: PILLARS, portfolio: PORTFOLIO, count: PORTFOLIO.length },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
