"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSurahs, getSurahText, getSurahTranslation, getSurahTafsir, getAudioUrls } from "@/lib/api";
import { useQuranStore, ayahFontSize } from "@/lib/store";
import type { Surah, Ayah } from "@/types/quran";
import { AyahCard } from "@/components/AyahCard";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { ErrorState, Spinner } from "@/components/ui/Bits";
import { faNum } from "@/lib/utils";

export default function SurahPage() {
  const params = useParams<{ id: string }>();
  const surahId = Number(params.id);
  const { settings, setLast, last } = useQuranStore();

  const [surah, setSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [trans, setTrans] = useState<Record<string, string>>({});
  const [tafsir, setTafsir] = useState<Record<string, string>>({});
  const [audioMap, setAudioMap] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const forceReload = () => setReloadTick((t) => t + 1);
  const viewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // text + surah meta — once per surah
  useEffect(() => {
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) return;
    let alive = true;
    setError(false);
    setAyahs(null);
    (async () => {
      try {
        const [surahs, text] = await Promise.all([getSurahs(), getSurahText(surahId)]);
        if (!alive) return;
        setSurah(surahs.find((s) => s.id === surahId) ?? null);
        setAyahs(text);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [surahId, reloadTick]);

  // translation + tafsir + audio — refetch on relevant setting change
  useEffect(() => {
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) return;
    let alive = true;
    getSurahTranslation(surahId, settings.translationId)
      .then((m) => alive && setTrans(m))
      .catch(() => {});
    if (settings.displayMode === "full") {
      getSurahTafsir(surahId, settings.tafsirId)
        .then((m) => alive && setTafsir(m))
        .catch(() => {});
    }
    getAudioUrls(surahId, settings.reciterId)
      .then((m) => alive && setAudioMap(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [surahId, settings.translationId, settings.tafsirId, settings.displayMode, settings.reciterId]);

  // mark last activity: scroll-tracked "last viewed ayah" (middle viewport band)
  useEffect(() => {
    if (!ayahs?.length) return;
    const t = setTimeout(() => {
      const h = window.location.hash;
      const m = h.match(/#ayah-(\d+)/);
      if (m) document.getElementById(`ayah-${m[1]}`)?.scrollIntoView({ block: "start" });
    }, 100);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const n = Number(e.target.id.replace("ayah-", ""));
          if (!n) continue;
          clearTimeout(viewTimer.current);
          viewTimer.current = setTimeout(() => {
            setLast({ surahId, ayahN: n, surahNameFa: surah?.nameFa ?? "", ts: Date.now() });
          }, 800);
        }
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    for (const a of ayahs) {
      const el = document.getElementById(`ayah-${a.n}`);
      if (el) io.observe(el);
    }
    return () => {
      clearTimeout(t);
      clearTimeout(viewTimer.current);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayahs?.length, surah?.nameFa]);

  const ayahKeys = useMemo(() => (ayahs ?? []).map((a) => ({ key: a.key, n: a.n })), [ayahs]);
  const player = useAudioPlayer({ ayahs: ayahKeys, audioMap, translations: trans });
  const playingKey = player.st.surahId === surahId ? player.st.ayahN : null;

  // دنبال‌کردن متن با پخش: اسکرول خودکار به آیهٔ در حال پخش (اگر خود کاربر اسکرول نکرده باشد)
  const followRef = useRef(true);
  useEffect(() => {
    const onWheel = () => (followRef.current = false);
    const onTouch = () => (followRef.current = false);
    addEventListener("wheel", onWheel, { passive: true });
    addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      removeEventListener("wheel", onWheel);
      removeEventListener("touchstart", onTouch);
    };
  }, []);
  useEffect(() => {
    if (!playingKey || !followRef.current) return;
    document.getElementById(`ayah-${playingKey}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [playingKey]);

  if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
    return <ErrorState message="شماره سوره نامعتبر است" />;
  }
  if (error) return <ErrorState message="متن سوره بارگذاری نشد — اتصال اینترنت را بررسی کنید" onRetry={() => { setError(false); setAyahs(null); forceReload(); }} />;

  const prevId = surahId > 1 ? surahId - 1 : null;
  const nextId = surahId < 114 ? surahId + 1 : null;

  return (
    <div>
      {/* header */}
      <div className="mb-5 flex items-center justify-between">
        <Link href="/quran" aria-label="فهرست سوره‌ها" className="rounded-lg p-2 text-ink2 hover:bg-surface2">
          <ChevronRight className="size-5" />
        </Link>
        <h1 className="text-xl font-bold">
          سوره {surah?.nameFa ?? ""}
          {surah && <span className="mr-2 text-sm font-normal text-ink2">{surah.place === "makkah" ? "مکی" : "مدنی"} · {faNum(surah.versesCount)} آیه</span>}
        </h1>
        <span className="w-9" />
      </div>

      {/* bismillah */}
      {surah?.bismillahPre && surahId !== 9 && (
        <p dir="rtl" lang="ar" className="quran mb-5 text-center text-gold">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>
      )}

      {!ayahs ? (
        <div className="py-16 text-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-3" style={{ "--ayah-size": ayahFontSize(settings.fontSize) } as React.CSSProperties}>
          {ayahs.map((a) => (
            <AyahCard
              key={a.key}
              ayah={a}
              translation={trans[a.key]}
              tafsir={settings.displayMode === "full" ? tafsir[a.key] ?? null : null}
              playing={playingKey === a.n}
              playAyah={player.playAyah}
              surahNameFa={surah?.nameFa ?? ""}
            />
          ))}
        </div>
      )}

      {/* prev/next surah */}
      <div className="mt-6 flex justify-between">
        {prevId ? (
          <Link href={`/quran/${prevId}`} className="flex items-center gap-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm">
            <ChevronRight className="size-4" /> سوره قبلی
          </Link>
        ) : <span />}
        {nextId && (
          <Link href={`/quran/${nextId}`} className="flex items-center gap-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm">
            سوره بعدی <ChevronLeft className="size-4" />
          </Link>
        )}
      </div>

      {ayahs && (
        <AudioPlayer
          ayahs={ayahKeys}
          audioMap={audioMap}
          surahNameFa={surah?.nameFa ?? ""}
          player={player}
        />
      )}
    </div>
  );
}
