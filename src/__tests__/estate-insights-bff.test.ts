// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// TEC Estate — Portfolio Insights BFF (C-114). Estate Pro's standalone service: an
// aggregate of the caller's OWN properties (read from asset-service). Identity is the
// session (P6). The aggregate is gated behind the caller's LIVE subscription (P5) and
// carries NO valuation (C-114 §5). A non-Pro sees { pro:false }.
const GW = 'https://api.example.com';
process.env.API_GATEWAY_URL = GW;
process.env.INTERNAL_SECRET = 'secret';

const userCookie = JSON.stringify({ id: 'user-123', piId: 'pi-1' });
const makeReq = (cookies?: Record<string, string>) => {
  const cookieStr = cookies ? Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ') : '';
  const headers: Record<string, string> = {};
  if (cookieStr) headers['Cookie'] = cookieStr;
  return new NextRequest('http://localhost/api/bff/estate/insights', { method: 'GET', headers });
};
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env.API_GATEWAY_URL = GW;
  process.env.INTERNAL_SECRET = 'secret';
});

describe('GET /api/bff/estate/insights (Pro Portfolio Insights, gated)', () => {
  it('401 without a session', async () => {
    const { GET } = await import('@/app/api/bff/estate/insights/route');
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('non-Pro → { pro:false } and NEVER fetches the asset list (P5 gate)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: { subscription: { plan: 'FREE', isActive: true } } })); // sub = not Pro
    const { GET } = await import('@/app/api/bff/estate/insights/route');
    const res  = await GET(makeReq({ tec_user: userCookie, tec_access_token: 'tok' }));
    const json = await res.json();
    expect(json.pro).toBe(false);
    expect(json.insights).toBeNull();
    expect(fetchSpy.mock.calls.every(([u]) => !String(u).includes('/api/assets/user/'))).toBe(true);
    fetchSpy.mockRestore();
  });

  it('Pro → aggregates the owner’s properties by type/occupancy (no valuation, C-114 §5)', async () => {
    const propertyAsset = (over: Record<string, unknown>) => ({
      slug: 's', category: 'REAL_ESTATE',
      metadata: { kind: 'property', title: 'P', type: 'apartment', ownership: 'owned', leaseStatus: 'leased', zoneVerified: true, ...over },
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: { subscription: { plan: 'PRO', isActive: true, isExpired: false } } }))          // sub = Pro
      .mockResolvedValueOnce(ok({ data: [
        propertyAsset({ type: 'apartment', leaseStatus: 'leased',  zoneVerified: true }),
        propertyAsset({ type: 'villa',     leaseStatus: 'listed',  zoneVerified: false }),
      ] }));
    const { GET } = await import('@/app/api/bff/estate/insights/route');
    const res  = await GET(makeReq({ tec_user: userCookie, tec_access_token: 'tok' }));
    const json = await res.json();
    expect(json.pro).toBe(true);
    expect(json.insights.total).toBe(2);
    expect(json.insights.leased).toBe(1);
    expect(json.insights.listed).toBe(1);
    expect(json.insights.zoneVerified).toBe(1);
    expect(json.insights).not.toHaveProperty('value');       // never a summed valuation
    expect(json.insights).not.toHaveProperty('totalValue');
    const assetCall = fetchSpy.mock.calls.find(([u]) => String(u).includes('/api/assets/user/user-123'));
    expect(assetCall).toBeDefined();
    fetchSpy.mockRestore();
  });
});
