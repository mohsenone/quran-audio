// Audio proxy: streams verses.quran.com files through our origin so Iranian
// clients never touch Google Cloud Storage directly. Range requests pass
// through for seeking. Path-restricted — no open proxy.
export const dynamic = "force-dynamic";

const ALLOWED_HOST = "verses.quran.com";

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  // only mp3 files under reciter folders, e.g. Alafasy/mp3/001001.mp3
  if (!path.length || path.some((p) => !/^[A-Za-z0-9_.-]+$/.test(p)) || !path.at(-1)?.endsWith(".mp3")) {
    return new Response("bad path", { status: 400 });
  }
  const upstream = `https://${ALLOWED_HOST}/${path.map(encodeURIComponent).join("/")}`;
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
