import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// POST /api/bff/estate/property no longer creates a property — asset-service records it
// from the payment's own event (the property travels in the product id). This route only
// claims the payment for the session user and reports where that stands.

const USER = { id: '11111111-1111-4111-8111-111111111111' };

// jsdom drops a `cookie` header (browsers forbid setting it), so set them on the request.
const req = (body: unknown, cookies = true) => {
  const r = new NextRequest('https://estate.tecosystem.app/api/bff/estate/property', {
    method: 'POST', body: JSON.stringify(body),
  });
  if (cookies) {
    r.cookies.set('tec_access_token', 'tok');
    r.cookies.set('tec_user', encodeURIComponent(JSON.stringify(USER)));
  }
  return r;
};

describe('POST /api/bff/estate/property — claim the paid listing fee', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env.API_GATEWAY_URL = 'https://gateway.test';
    process.env.INTERNAL_SECRET = 'secret';
  });

  it('claims the payment for the session user — never a body user — and passes the answer through', async () => {
    const fetchMock = vi.fn(async () => ({ status: 202, json: async () => ({ status: 'pending' }) }));
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/bff/estate/property/route');

    const res = await POST(req({ payment_id: 'pi-abc', userId: 'someone-else' }));

    expect(res.status).toBe(202);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://gateway.test/api/assets/purchases/pi-abc/claim');
    expect(JSON.parse(init.body as string)).toEqual({ userId: USER.id });
  });

  it('no longer provisions an asset directly', async () => {
    const fetchMock = vi.fn(async () => ({ status: 200, json: async () => ({ status: 'applied' }) }));
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/bff/estate/property/route');
    await POST(req({ payment_id: 'p1' }));
    expect((fetchMock.mock.calls as unknown as Array<[string]>).some(([u]) => u.includes('/assets/provision'))).toBe(false);
  });

  it('refuses without a session, and without a payment id', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { POST } = await import('@/app/api/bff/estate/property/route');
    expect((await POST(req({ payment_id: 'p1' }, false))).status).toBe(401);
    expect((await POST(req({}))).status).toBe(400);
  });

  it('a network failure is "pending", not an error — the event still records it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNRESET'); }));
    const { POST } = await import('@/app/api/bff/estate/property/route');
    expect((await POST(req({ payment_id: 'p1' }))).status).toBe(202);
  });
});
