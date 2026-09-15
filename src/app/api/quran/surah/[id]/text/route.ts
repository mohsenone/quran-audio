import { getSurahText } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const surahId = Number(id);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
      return Response.json({ error: "bad surah id" }, { status: 400 });
    }
    const ayahs = await getSurahText(surahId);
    return Response.json({ ayahs });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
