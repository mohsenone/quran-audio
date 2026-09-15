import { getTafsir, TAFSIR_EDITIONS } from "@/lib/providers";

export const dynamic = "force-dynamic";

const VALID = new Set(TAFSIR_EDITIONS.map((t) => t.id));

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const surahId = Number(id);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
      return Response.json({ error: "bad surah id" }, { status: 400 });
    }
    const edition = new URL(req.url).searchParams.get("edition") ?? "ar.muyassar";
    if (!VALID.has(edition as (typeof TAFSIR_EDITIONS)[number]["id"])) {
      return Response.json({ error: "bad edition" }, { status: 400 });
    }
    const map = await getTafsir(surahId, edition);
    return Response.json({ map });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
