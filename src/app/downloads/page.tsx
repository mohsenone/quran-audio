"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { getSurahs, getSurahText, getAudioUrls } from "@/lib/api";
import { useQuranStore } from "@/lib/store";
import { downloadSurahAudio, getOfflineProgress, listDownloads, deleteSurahAudio, clearAllAudio, audioStorageUsed } from "@/lib/offline-audio";
import type { Surah } from "@/types/quran";
import { EmptyState, Spinner } from "@/components/ui/Bits";
import { faNum } from "@/lib/utils";

function fmtSize(bytes: number): string {
  if (!bytes) return "۰";
  const mb = bytes / 1024 / 1024;
  return `${mb.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت`;
}

export default function DownloadsPage() {
  const reciterId = useQuranStore((s) => s.settings.reciterId);
  const [surahs, setSurahs] = useState<Surah[] | null>(null);
  const [downloads, setDownloads] = useState<Record<string, { done: number; total: number }>>({});
  const [active, setActive] = useState<Record<number, { done: number; total: number }>>({});
  const [usage, setUsage] = useState(0);

  const refresh = () => {
    listDownloads().then((metas) => {
      const map: Record<string, { done: number; total: number }> = {};
      for (const m of metas) map[m.key] = { done: m.done, total: m.total };
      setDownloads(map);
    });
    audioStorageUsed().then(setUsage);
  };
  useEffect(() => {
    getSurahs().then(setSurahs).catch(() => setSurahs([]));
    refresh();
  }, []);

  const start = async (surahId: number) => {
    try {
      const [ayahs, audio] = await Promise.all([getSurahText(surahId), getAudioUrls(surahId, reciterId)]);
      await downloadSurahAudio(surahId, reciterId, audio, (done, total) =>
        setActive((a) => ({ ...a, [surahId]: { done, total } }))
      );
    } catch {
      setActive((a) => {
        const { [surahId]: _, ...rest } = a;
        return rest;
      });
    } finally {
      refresh();
      setActive((a) => {
        const { [surahId]: _, ...rest } = a;
        return rest;
      });
    }
  };

  const remove = async (surahId: number) => {
    const audio = await getAudioUrls(surahId, reciterId).catch(() => ({}));
    const verseKeys = Object.keys(audio);
    await deleteSurahAudio(surahId, reciterId, verseKeys);
    refresh();
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">دانلودها</h1>
      <p className="mb-4 text-sm text-ink2">حجم مصرف‌شده: {fmtSize(usage)}</p>

      <button
        onClick={async () => {
          await clearAllAudio();
          refresh();
        }}
        className="mb-4 rounded-lg border border-line px-3 py-1.5 text-xs text-ink2 hover:border-red-400 hover:text-red-500"
      >
        پاک کردن همه دانلودها
      </button>

      {surahs !== null && surahs.length === 0 && <EmptyState message="فهرست سوره‌ها در دسترس نیست" />}

      <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {(surahs ?? []).map((s) => {
          const d = downloads[`s${s.id}-r${reciterId}`];
          const prog = active[s.id];
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{s.nameFa}</span>
                <span className="block text-xs text-ink2">
                  {d
                    ? d.done >= d.total
                      ? "دانلود شده ✓"
                      : `${faNum(d.done)} از ${faNum(d.total)}`
                    : prog
                      ? `${faNum(prog.done)} از ${faNum(prog.total)}…`
                      : "دانلود نشده"}
                </span>
              </span>
              {prog ? (
                <Spinner className="size-4" />
              ) : d && d.done >= d.total ? (
                <button
                  onClick={() => remove(s.id)}
                  aria-label={`حذف دانلود ${s.nameFa}`}
                  className="rounded-lg p-2 text-ink2 hover:bg-surface2 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : (
                <button
                  onClick={() => start(s.id)}
                  aria-label={`دانلود ${s.nameFa}`}
                  className="rounded-lg p-2 text-ink2 hover:bg-surface2 hover:text-accent"
                >
                  <Download className="size-4" />
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
