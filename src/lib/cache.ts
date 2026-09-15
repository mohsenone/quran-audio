// Server-side cache for upstream API responses (stale-while-revalidate: 1h fresh).
const store = new Map<string, { data: unknown; ts: number }>();
const TTL = 60 * 60 * 1000;

export async function cached<T>(url: string, load: () => Promise<T>): Promise<T> {
  const hit = store.get(url);
  if (hit && Date.now() - hit.ts < TTL) return hit.data as T;
  if (hit) {
    // serve stale, refresh in background — never block on a slow upstream
    load().then((data) => store.set(url, { data, ts: Date.now() })).catch(() => {});
    return hit.data as T;
  }
  const data = await load();
  store.set(url, { data, ts: Date.now() });
  return data;
}
