export interface Surah {
  id: number;
  nameSimple: string;
  nameArabic: string;
  nameFa: string;
  versesCount: number;
  place: "makkah" | "madinah";
  bismillahPre: boolean;
}

export interface Ayah {
  key: string; // "2:255"
  surahId: number;
  n: number; // number in surah
  text: string; // Arabic
  juz: number;
  page: number;
  sajda: boolean;
}

export interface Reciter {
  id: number;
  name: string;
  style: string | null;
}

export interface TafsirInfo {
  slug: string;
  name: string;
  lang: string;
}

export interface AyahFull {
  ayah: Ayah;
  translation: string;
  tafsir: string | null;
  audioUrl: string | null;
}

export interface SearchResult {
  key: string;
  surahId: number;
  surahNameFa: string;
  n: number;
  text: string; // Arabic
  translation: string;
}

export interface Bookmark {
  key: string;
  surahId: number;
  surahNameFa: string;
  n: number;
  arabic: string;
  translation: string;
  note?: string;
  createdAt: number;
}

export interface LastActivity {
  surahId: number;
  ayahN: number;
  surahNameFa: string;
  ts: number;
}
