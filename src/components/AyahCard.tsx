"use client";

import { memo, useState } from "react";
import { Bookmark, Check, Copy, Play, Share2 } from "lucide-react";
import type { Ayah } from "@/types/quran";
import { useQuranStore } from "@/lib/store";
import { cn, faNum } from "@/lib/utils";

function TafsirBox({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="text-sm text-accent hover:underline"
      >
        {open ? "بستن تفسیر" : "تفسیر آیه"}
      </button>
      {open && (
        <p dir="rtl" className="mt-2 rounded-xl bg-surface2 p-3 text-sm leading-7 text-ink">
          {text}
        </p>
      )}
    </div>
  );
}

export const AyahCard = memo(function AyahCard({
  ayah,
  translation,
  tafsir,
  playing,
  playAyah,
  surahNameFa,
}: {
  ayah: Ayah;
  translation?: string;
  tafsir?: string | null;
  playing: boolean;
  playAyah?: (n: number, autoplay?: boolean) => void;
  surahNameFa: string;
}) {
  const { settings, bookmarks, toggleBookmark } = useQuranStore();
  const [copied, setCopied] = useState(false);
  const bookmarked = bookmarks.some((b) => b.key === ayah.key);
  const showT = settings.displayMode !== "arabic";
  const showTafsir = settings.displayMode === "full";

  const ref = `${surahNameFa} — آیه ${faNum(ayah.n)}`;

  const share = async () => {
    const text = `${ayah.text}\n\n${translation ?? ""}\n\n${ref}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: ref, text });
        return;
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(`${ayah.text}\n${translation ?? ""}\n${ref}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article
      id={`ayah-${ayah.n}`}
      className={cn(
        "scroll-mt-20 rounded-2xl border p-4 transition-colors md:p-5",
        playing ? "border-accent bg-accent-soft" : "border-line bg-surface"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-md bg-surface2 px-2 py-0.5 text-xs text-ink2">{faNum(ayah.n)}</span>
        {ayah.sajda && <span className="text-xs text-gold">۩ سجده</span>}
      </div>

      <p
        dir="rtl"
        lang="ar"
        className={cn("quran text-ink", playing && "font-bold")}
        style={{ "--ayah-size": undefined } as React.CSSProperties}
      >
        {ayah.text}
      </p>

      {showT && translation && (
        <p dir="rtl" className={cn("mt-3 border-t border-line pt-3 leading-7", playing ? "text-ink font-medium" : "text-ink2")}>
          {translation}
        </p>
      )}

      {showTafsir && tafsir && <TafsirBox text={tafsir} />}

      <div className="mt-3 flex items-center gap-1">
        <button
          onClick={() => playAyah?.(ayah.n)}
          aria-label={`پخش آیه ${ayah.n}`}
          className="rounded-lg p-2 text-ink2 hover:bg-surface2 hover:text-accent"
        >
          <Play className="size-4" />
        </button>
        <button
          onClick={() =>
            toggleBookmark({
              key: ayah.key,
              surahId: ayah.surahId,
              surahNameFa,
              n: ayah.n,
              arabic: ayah.text,
              translation: translation ?? "",
              createdAt: Date.now(),
            })
          }
          aria-label={bookmarked ? "حذف نشان" : "افزودن نشان"}
          aria-pressed={bookmarked}
          className={cn("rounded-lg p-2 hover:bg-surface2", bookmarked ? "text-accent" : "text-ink2")}
        >
          <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
        </button>
        <button onClick={share} aria-label="همرسانی" className="rounded-lg p-2 text-ink2 hover:bg-surface2">
          <Share2 className="size-4" />
        </button>
        <button onClick={copy} aria-label="کپی" className="rounded-lg p-2 text-ink2 hover:bg-surface2">
          {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />}
        </button>
      </div>
    </article>
  );
});
