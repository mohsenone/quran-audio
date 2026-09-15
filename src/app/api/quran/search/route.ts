import { searchArabic, searchTranslation } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const mode = url.searchParams.get("mode") ?? "arabic";
    const edition = url.searchParams.get("edition") ?? "fa.fooladvand";
    if (!q) return Response.json({ results: [] });
    if (q.length > 100) return Response.json({ error: "query too long" }, { status: 400 });

    if (mode === "translation") {
      const results = await searchTranslation(q, edition);
      return Response.json({ results });
    }
    const results = await searchArabic(q);
    return Response.json({ results });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
