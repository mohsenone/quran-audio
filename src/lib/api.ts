// API service layer — the ONLY client-side data interface. UI never touches
// providers/upstream directly; swap the backend without touching components.
// All functions are client-safe (route handlers add server cache + CORS hygiene).
import type { Surah, Ayah, Reciter, TafsirInfo, SearchResult } from "@/types/quran";

export const FA_TRANSLATIONS = [
  { id: "fa.fooladvand", name: "فولادوند" },
  { id: "fa.makarem", name: "مکارم شیرازی" },
  { id: "fa.ansarian", name: "انصاریان" },
  { id: "fa.khorramshahi", name: "خرمشاهی" },
  { id: "fa.ghomshei", name: "الهی قمشه‌ای" },
] as const;

export const TAFSIRS = [
  { id: "ar.muyassar", name: "تفسیر المیسر" },
  { id: "ar.jalalayn", name: "تفسیر جلالین" },
  { id: "ar.qurtubi", name: "تفسیر قرطبی" },
  { id: "ar.baghawi", name: "تفسیر بغوی" },
] as const;

const SURAHS_FALLBACK: Surah[] = [
  "حمد","بقره","آل عمران","نساء","مائده","انعام","اعراف","انفال","توبه","یونس","هود","یوسف","رعد","ابراهیم","حجر","نحل","اسراء","کهف","مریم","طه","انبیاء","حج","مومنون","نور","فرقان","شعراء","نمل","قصص","عنکبوت","روم","لقمان","سجده","احزاب","سبا","فاطر","یس","صافات","ص","زمر","غافر","فصلت","شوری","زخرف","دخان","جاثیه","احقاف","محمد","فتح","حجرات","ق","ذاریات","طور","نجم","قمر","رحمن","واقعه","حدید","مجادله","حشر","ممتحنه","صف","جمعه","منافقون","تغابن","طلاق","تحریم","ملک","قلم","حاقه","معارج","نوح","جن","مزمل","مدثر","قیامه","انسان","مرسلات","نبأ","نازعات","عبس","تکویر","انفطار","مطففین","انشقاق","بروج","طارق","اعلی","غاشیه","فجر","بلد","شمس","لیل","ضحی","شرح","تین","علق","قدر","بینه","زلزله","عادیات","قارعه","تکاثر","عصر","همزه","فیل","قریش","ماعون","کوثر","کافرون","نصر","لهب","اخلاص","فلق","ناس",
].map((name, i) => ({ id: i + 1, nameSimple: "", nameArabic: "", nameFa: name, versesCount: 0, place: "makkah" as const, bismillahPre: true }));

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`/api/quran/${path}`);
  if (!res.ok) throw new Error(`api ${path} ${res.status}`);
  return res.json();
}

export async function getSurahs(): Promise<Surah[]> {
  try {
    const data = await api<{ surahs: Surah[] }>("surahs");
    return data.surahs;
  } catch {
    return SURAHS_FALLBACK; // offline: names + numbers still browsable
  }
}

export async function getSurahText(surahId: number): Promise<Ayah[]> {
  const data = await api<{ ayahs: Ayah[] }>(`surah/${surahId}/text`);
  return data.ayahs;
}

export async function getSurahTranslation(surahId: number, edition: string): Promise<Record<string, string>> {
  const data = await api<{ map: Record<string, string> }>(`surah/${surahId}/translation?edition=${edition}`);
  return data.map;
}

export async function getSurahTafsir(surahId: number, edition: string): Promise<Record<string, string>> {
  const data = await api<{ map: Record<string, string> }>(`surah/${surahId}/tafsir?edition=${edition}`);
  return data.map;
}

export async function getReciters(): Promise<Reciter[]> {
  try {
    const data = await api<{ reciters: Reciter[] }>("reciters");
    return data.reciters;
  } catch {
    return []; // offline: reciter list simply empty, player uses last known URLs
  }
}

export async function getTafsirSources(): Promise<TafsirInfo[]> {
  return TAFSIRS.map((t) => ({ slug: t.id, name: t.name, lang: "ar" }));
}

export async function getAudioUrls(surahId: number, reciterId: number): Promise<Record<string, string>> {
  const data = await api<{ map: Record<string, string> }>(`surah/${surahId}/audio?reciter=${reciterId}`);
  return data.map;
}

export async function searchQuran(query: string, edition: string, mode: "arabic" | "translation" | "both"): Promise<SearchResult[]> {
  const q = encodeURIComponent(query.trim());
  if (!q) return [];
  if (mode === "translation") {
    const data = await api<{ results: SearchResult[] }>(`search?q=${q}&edition=${edition}&mode=translation`);
    return data.results;
  }
  // arabic or both: arabic primary; "both" merges translation hits
  const arabic = await api<{ results: SearchResult[] }>(`search?q=${q}&mode=arabic`);
  if (mode === "arabic") return arabic.results;
  let trans: SearchResult[] = [];
  try {
    const t = await api<{ results: SearchResult[] }>(`search?q=${q}&edition=${edition}&mode=translation`);
    trans = t.results;
  } catch { /* translation search optional */ }
  const seen = new Set(arabic.results.map((r) => r.key));
  return [...arabic.results, ...trans.filter((r) => !seen.has(r.key))];
}
