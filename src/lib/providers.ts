// Provider adapters — the ONLY place that knows upstream APIs. Swap freely.
import type { Surah, Ayah, Reciter, TafsirInfo, SearchResult } from "@/types/quran";

const QURANCOM = "https://api.quran.com/api/v4";
const ALQURAN = "https://api.alquran.cloud/v1";
const QURANENC = "https://quranenc.com/api/v1";

export const FA_TRANSLATIONS = [
  { id: "fa.fooladvand", name: "فولادوند" },
  { id: "fa.makarem", name: "مکارم شیرازی" },
  { id: "fa.ansarian", name: "انصاریان" },
  { id: "fa.khorramshahi", name: "خرمشاهی" },
  { id: "fa.ghomshei", name: "الهی قمشه‌ای" },
  { id: "fa.mojtabavi", name: "مجتبوی" },
] as const;

export const TAFSIR_EDITIONS = [
  { id: "fa.saadi", name: "تفسیر سعدی (فارسی)" },
  { id: "ar.muyassar", name: "تفسیر المیسر" },
  { id: "ar.jalalayn", name: "تفسیر جلالین" },
  { id: "ar.qurtubi", name: "تفسیر قرطبی" },
  { id: "ar.baghawi", name: "تفسیر بغوی" },
  { id: "ar.waseet", name: "تفسیر واسط" },
] as const;

const SURAH_NAMES_FA = [
  "حمد","بقره","آل عمران","نساء","مائده","انعام","اعراف","انفال","توبه","یونس","هود","یوسف","رعد","ابراهیم","حجر","نحل","اسراء","کهف","مریم","طه","انبیاء","حج","مومنون","نور","فرقان","شعراء","نمل","قصص","عنکبوت","روم","لقمان","سجده","احزاب","سبا","فاطر","یس","صافات","ص","زمر","غافر","فصلت","شوری","زخرف","دخان","جاثیه","احقاف","محمد","فتح","حجرات","ق","ذاریات","طور","نجم","قمر","رحمن","واقعه","حدید","مجادله","حشر","ممتحنه","صف","جمعه","منافقون","تغابن","طلاق","تحریم","ملک","قلم","حاقه","معارج","نوح","جن","مزمل","مدثر","قیامه","انسان","مرسلات","نبأ","نازعات","عبس","تکویر","انفطار","مطففین","انشقاق","بروج","طارق","اعلی","غاشیه","فجر","بلد","شمس","لیل","ضحی","شرح","تین","علق","قدر","بینه","زلزله","عادیات","قارعه","تکاثر","عصر","همزه","فیل","قریش","ماعون","کوثر","کافرون","نصر","لهب","اخلاص","فلق","ناس",
];

export async function getSurahs(): Promise<Surah[]> {
  const res = await fetch(`${QURANCOM}/chapters`);
  if (!res.ok) throw new Error(`chapters ${res.status}`);
  const data = await res.json();
  return (data.chapters as any[]).map((c) => ({
    id: c.id,
    nameSimple: c.name_simple,
    nameArabic: c.name_arabic,
    nameFa: SURAH_NAMES_FA[c.id - 1] ?? c.name_simple,
    versesCount: c.verses_count,
    place: c.revelation_place as "makkah" | "madinah",
    bismillahPre: c.bismillah_pre,
  }));
}

export async function getSurahText(surahId: number): Promise<Ayah[]> {
  const res = await fetch(`${QURANCOM}/verses/by_chapter/${surahId}?fields=text_uthmani&per_page=300`);
  if (!res.ok) throw new Error(`verses ${res.status}`);
  const data = await res.json();
  return (data.verses as any[]).map((v) => ({
    key: v.verse_key,
    surahId,
    n: v.verse_number,
    text: v.text_uthmani,
    juz: v.juz_number,
    page: v.page_number,
    sajda: !!v.sajda_number,
  }));
}

export async function getTranslation(surahId: number, edition: string): Promise<Record<string, string>> {
  const res = await fetch(`${ALQURAN}/surah/${surahId}/${edition}`);
  if (!res.ok) throw new Error(`translation ${res.status}`);
  const data = await res.json();
  const map: Record<string, string> = {};
  for (const a of data.data.ayahs) map[`${surahId}:${a.numberInSurah}`] = a.text;
  return map;
}

export async function getTafsir(surahId: number, edition: string): Promise<Record<string, string>> {
  // تفسیر فارسی سعدی از QuranEnc (per-aya). بقیه: alquran.cloud per-surah.
  if (edition === "fa.saadi") {
    const versesCount = (await getSurahs()).find((s) => s.id === surahId)?.versesCount ?? 0;
    const results = await Promise.all(
      Array.from({ length: versesCount }, (_, i) => i + 1).map(async (n) => {
        try {
          const res = await fetch(`${QURANENC}/translation/aya/persian_saadi/${surahId}/${n}`);
          if (!res.ok) return [n, ""] as const;
          const d = await res.json();
          return [n, (d.result?.translation as string) ?? ""] as const;
        } catch {
          return [n, ""] as const;
        }
      })
    );
    const map: Record<string, string> = {};
    for (const [n, text] of results) if (text) map[`${surahId}:${n}`] = text;
    if (!Object.keys(map).length) throw new Error("tafsir fa.saadi empty");
    return map;
  }
  const res = await fetch(`${ALQURAN}/surah/${surahId}/${edition}`);
  if (!res.ok) throw new Error(`tafsir ${res.status}`);
  const data = await res.json();
  const map: Record<string, string> = {};
  for (const a of data.data.ayahs) map[`${surahId}:${a.numberInSurah}`] = a.text;
  return map;
}

export async function getReciters(): Promise<Reciter[]> {
  const res = await fetch(`${QURANCOM}/resources/recitations`);
  if (!res.ok) throw new Error(`recitations ${res.status}`);
  const data = await res.json();
  return (data.recitations as any[]).map((r) => ({
    id: r.id,
    name: r.reciter_name,
    style: r.style,
  }));
}

export async function getTafsirSources(): Promise<TafsirInfo[]> {
  return TAFSIR_EDITIONS.map((t) => ({ slug: t.id, name: t.name, lang: "ar" }));
}

export async function getAudioUrls(surahId: number, reciterId: number): Promise<Record<string, string>> {
  const res = await fetch(`${QURANCOM}/recitations/${reciterId}/by_chapter/${surahId}?per_page=300`);
  if (!res.ok) throw new Error(`audio ${res.status}`);
  const data = await res.json();
  const map: Record<string, string> = {};
  for (const f of data.audio_files as any[]) {
    // stream through our origin (Iran-CDN-friendly), same-origin = no CORS
    map[f.verse_key] = `/api/audio/${f.url}`;
  }
  return map;
}

export async function searchArabic(query: string): Promise<SearchResult[]> {
  const normalized = query.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "");
  const res = await fetch(`${QURANCOM}/verses/by_tajweed_or_text/${encodeURIComponent(normalized)}?language=fa&words=false`);
  if (res.ok) {
    const data = await res.json();
    if (data.verses?.length) {
      return (data.verses as any[]).slice(0, 40).map((v) => ({
        key: v.verse_key,
        surahId: v.verse_key.split(":")[0] | 0,
        surahNameFa: SURAH_NAMES_FA[(v.verse_key.split(":")[0] | 0) - 1] ?? "",
        n: v.verse_number,
        text: strip(v.text_uthmani ?? v.text_imlaei ?? ""),
        translation: "",
      }));
    }
  }
  // fallback: alquran.cloud search over Arabic
  const r2 = await fetch(`${ALQURAN}/search/${encodeURIComponent(normalized)}/all/ar.muyassar`);
  if (!r2.ok) return [];
  const d2 = await r2.json();
  return (d2.data?.matches ?? []).slice(0, 40).map((m: any) => ({
    key: `${m.surah.number}:${m.numberInSurah}`,
    surahId: m.surah.number,
    surahNameFa: SURAH_NAMES_FA[m.surah.number - 1] ?? "",
    n: m.numberInSurah,
    text: strip(m.text),
    translation: "",
  }));
}

export async function searchTranslation(query: string, edition = "fa.fooladvand"): Promise<SearchResult[]> {
  const res = await fetch(`${ALQURAN}/search/${encodeURIComponent(query)}/all/${edition}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data?.matches ?? []).slice(0, 40).map((m: any) => ({
    key: `${m.surah.number}:${m.numberInSurah}`,
    surahId: m.surah.number,
    surahNameFa: SURAH_NAMES_FA[m.surah.number - 1] ?? "",
    n: m.numberInSurah,
    text: m.surah.name,
    translation: m.text,
  }));
}

function strip(s: string): string {
  return s;
}
