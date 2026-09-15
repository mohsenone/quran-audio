import { getAudioUrls } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const surahId = Number(id);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
      return Response.json({ error: "bad surah id" }, { status: 400 });
    }
    const reciter = Number(new URL(req.url).searchParams.get("reciter") ?? 7);
    if (!Number.isInteger(reciter) || reciter < 1 || reciter > 1000) {
      return Response.json({ error: "bad reciter" }, { status: 400 });
    }
    const map = await getAudioUrls(surahId, reciter);
    return Response.json({ map });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
