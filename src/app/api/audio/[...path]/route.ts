// Audio proxy: streams verses.quran.com + everyayah.com files through our origin so Iranian
// clients never touch those hosts directly (some are slow/blocked in Iran). Range requests pass
// through for seeking. Path-restricted — no open proxy.
export const dynamic = "force-dynamic";

const DEFAULT_HOST = "https://verses.quran.com";
// explicit prefix routes: first path segment → upstream base URL (rest pass through)
const PREFIX_ROUTES: Record<string, string> = {
  everyayah: "https://everyayah.com/data",
};

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  // e.g. /api/audio/Alafasy/mp3/001001.mp3 (→ verses.quran.com/Alafasy/…) or
  //      /api/audio/everyayah/Parhizgar_48kbps/001001.mp3 (→ everyayah.com/data/Parhizgar_48kbps/…)
  if (!path.length || path.some((p) => !/^[A-Za-z0-9_.-]+$/.test(p)) || !path.at(-1)?.endsWith(".mp3")) {
    return new Response("bad path", { status: 400 });
  }
  const prefixRoute = PREFIX_ROUTES[path[0]];
  const rest = prefixRoute ? path.slice(1) : path;
  const upstream = `${prefixRoute ?? DEFAULT_HOST}/${rest.map(encodeURIComponent).join("/")}`;
  const headers: HeadersInit = {};
  const range = req.headers.get("range");
  if (range) headers["Range"] = range;

  const res = await fetch(upstream, { headers });
  if (!res.ok && res.status !== 206) {
    return new Response("upstream error", { status: 502 });
  }
  const out = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(res.body, { status: res.status, headers: out });
}
