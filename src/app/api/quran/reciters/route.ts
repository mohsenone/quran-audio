import { getReciters } from "@/lib/providers";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reciters = await cached(
      "https://api.quran.com/api/v4/resources/recitations",
      async () => {
        const r = await getReciters();
        return { recitations: r };
      }
    );
    return Response.json({ reciters: (reciters as any).recitations ?? reciters });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
