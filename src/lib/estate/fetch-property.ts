// Server-only — fetch ONE live property (by slug) from tec-asset-service for the
// property detail page. Estate never owns the record; it reads + presents it
// (C-114 §12). Ownership isolation (P6): a property is returned ONLY to its owner
// — identity comes from the session cookie, never the URL. Any miss (no session,
// not a property, not the caller's, gateway error) fails closed → null → 404.
import { cookies } from 'next/headers';
import { isPropertyAsset, mapAssetToProperty, type AssetRecord, type Property } from './portfolio';

const GW = process.env.API_GATEWAY_URL ?? '';

export async function fetchLiveProperty(slug: string): Promise<Property | null> {
  if (!GW || !slug) return null;

  const jar    = await cookies();
  const token  = jar.get('tec_access_token')?.value ?? '';
  let userId = '';
  try {
    const u = JSON.parse(decodeURIComponent(jar.get('tec_user')?.value ?? ''));
    userId = u?.id ?? u?.sub ?? u?.piId ?? '';
  } catch { /* no/invalid session → fail closed */ }
  if (!userId) return null;

  try {
    const res = await fetch(`${GW}/api/assets/${encodeURIComponent(slug)}`, {
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
        'x-request-id':  crypto.randomUUID(),
        'x-user-id':     userId,
        ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body  = await res.json().catch(() => ({}));
    const asset = (body?.data ?? body) as AssetRecord | null;
    if (!asset) return null;

    // P6 isolation: only the owner may view it; and it must be a property.
    if (asset.ownerId && asset.ownerId !== userId) return null;
    if (!isPropertyAsset(asset)) return null;

    return mapAssetToProperty(asset);
  } catch {
    return null;
  }
}
