"use client";

import { Play, Pause, SkipForward, SkipBack, Repeat, Repeat1 } from "lucide-react";
import { useQuranStore } from "@/lib/store";
import type { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { cn, fmtTime } from "@/lib/utils";

type Player = ReturnType<typeof useAudioPlayer>;

export function AudioPlayer({
  ayahs,
  audioMap,
  surahNameFa,
  player,
}: {
  ayahs: { key: string; n: number }[];
  audioMap: Record<string, string>;
  surahNameFa: string;
  player: Player;
}) {
  const { settings, setSetting } = useQuranStore();
  const { st, toggle, next, prev, seek, setRate } = player;

  const repeat = settings.repeatMode;
  const cycleRepeat = () =>
    setSetting("repeatMode", repeat === "none" ? "ayah" : repeat === "ayah" ? "surah" : "none");

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-14 z-30 border-t border-line bg-surface px-4 py-2.5 md:bottom-0 md:pr-60",
        !st.surahId && "hidden"
      )}
      role="region"
      aria-label="پخش‌کننده صوت"
    >
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={prev} aria-label="آیه قبل" className="rounded-lg p-2 text-ink2 hover:bg-surface2">
            <SkipBack className="size-5" />
          </button>
          <button
            onClick={toggle}
            aria-label={st.playing ? "توقف" : "پخش"}
            className="rounded-full bg-accent p-3 text-white"
          >
            {st.playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
          <button onClick={next} aria-label="آیه بعد" className="rounded-lg p-2 text-ink2 hover:bg-surface2">
            <SkipForward className="size-5" />
          </button>
          <button
            onClick={cycleRepeat}
            aria-label="حالت تکرار"
            title={repeat === "none" ? "بدون تکرار" : repeat === "ayah" ? "تکرار آیه" : "تکرار سوره"}
            className={cn("rounded-lg p-2 text-ink2 hover:bg-surface2", repeat !== "none" && "text-accent")}
          >
            {repeat === "ayah" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between text-xs text-ink2">
            <span className="truncate">
              {surahNameFa || "…"} {st.ayahN ? `— آیه ${st.ayahN.toLocaleString("fa-IR")}` : ""}
              {st.loading && " …"}
            </span>
            <span className="tabular-nums">
              {fmtTime(st.position)} / {fmtTime(st.duration)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={st.duration || 0}
            step={0.5}
            value={st.position}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="جابجایی در صوت"
            className="w-full"
            disabled={!st.duration}
          />
          {st.error && <p className="mt-0.5 text-xs text-red-500">{st.error}</p>}
        </div>

        <select
          value={settings.playbackRate}
          onChange={(e) => setRate(Number(e.target.value))}
          aria-label="سرعت پخش"
          className="hidden rounded-lg border border-line bg-surface px-2 py-1.5 text-sm sm:block"
        >
          {[0.75, 1, 1.25, 1.5, 2].map((r) => (
            <option key={r} value={r}>
              {r}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
