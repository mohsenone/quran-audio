import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Bookmark, LastActivity } from "@/types/quran";

export type Theme = "light" | "dark" | "system";
export type DisplayMode = "arabic" | "arabic-translation" | "full";

export interface Settings {
  theme: Theme;
  displayMode: DisplayMode;
  fontSize: 1 | 2 | 3 | 4;
  translationId: string;
  tafsirId: string;
  reciterId: number;
  autoPlayNext: boolean;
  repeatMode: "none" | "ayah" | "surah";
  playbackRate: number;
  /** خواندن ترجمهٔ فارسی بعد از صوت آیه (Web Speech) */
  speakTranslation: boolean;
}

interface QuranState {
  settings: Settings;
  bookmarks: Bookmark[];
  last: LastActivity | null;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  toggleBookmark: (b: Bookmark) => void;
  setBookmarkNote: (key: string, note: string) => void;
  removeBookmark: (key: string) => void;
  setLast: (l: LastActivity) => void;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  displayMode: "arabic-translation",
  fontSize: 2,
  translationId: "fa.fooladvand",
  tafsirId: "ar.muyassar",
  reciterId: 7,
  autoPlayNext: true,
  repeatMode: "none",
  playbackRate: 1,
  speakTranslation: false,
};

const FONT_SIZES: Record<number, string> = { 1: "22px", 2: "28px", 3: "34px", 4: "42px" };
export function ayahFontSize(size: 1 | 2 | 3 | 4): string {
  return FONT_SIZES[size];
}

export function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export const useQuranStore = create<QuranState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      bookmarks: [],
      last: null,
      setSetting: (k, v) =>
        set((s) => {
          const settings = { ...s.settings, [k]: v };
          if (k === "theme") applyTheme(v as Theme);
          return { settings };
        }),
      toggleBookmark: (b) =>
        set((s) => ({
          bookmarks: s.bookmarks.some((x) => x.key === b.key)
            ? s.bookmarks.filter((x) => x.key !== b.key)
            : [b, ...s.bookmarks],
        })),
      setBookmarkNote: (key, note) =>
        set((s) => ({
          bookmarks: s.bookmarks.map((b) => (b.key === key ? { ...b, note } : b)),
        })),
      removeBookmark: (key) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.key !== key) })),
      setLast: (l) => set({ last: l }),
    }),
    {
      name: "quran-audio",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ settings: s.settings, bookmarks: s.bookmarks, last: s.last }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.settings.theme);
        if (typeof window !== "undefined") {
          window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
            if (useQuranStore.getState().settings.theme === "system") applyTheme("system");
          });
        }
      },
    }
  )
);
