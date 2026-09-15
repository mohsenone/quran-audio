import { getSurahs } from "@/lib/providers";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const surahs = await cached("https://api.quran.com/api/v4/chapters", async () => getSurahs());
    return Response.json({ surahs });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
