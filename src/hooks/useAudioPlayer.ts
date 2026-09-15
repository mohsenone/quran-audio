// Audio engine: single HTMLAudioElement, per-ayah files, offline cache via SW.
// ponytail: reciter change mid-playback restarts the current ayah (no cross-reciter seek alignment).
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuranStore } from "@/lib/store";

export interface PlayerState {
  playing: boolean;
  surahId: number | null;
  ayahN: number | null;
  loading: boolean;
  duration: number;
  position: number;
  error: string | null;
}

export function useAudioPlayer(opts: {
  ayahs: { key: string; n: number }[];
  audioMap: Record<string, string>;
}) {
  const settings = useQuranStore((s) => s.settings);
  const setSetting = useQuranStore((s) => s.setSetting);
  const setLast = useQuranStore((s) => s.setLast);
  const elRef = useRef<HTMLAudioElement | null>(null);
  const [st, setSt] = useState<PlayerState>({
    playing: false, surahId: null, ayahN: null, loading: false, duration: 0, position: 0, error: null,
  });

  // refs so the one-time `ended` handler always sees current data
  const ayahsRef = useRef(opts.ayahs);
  ayahsRef.current = opts.ayahs;
  const playAyahRef = useRef<(n: number, autoplay?: boolean) => void>(() => {});

  useEffect(() => {
    const el = new Audio();
    el.preload = "none";
    elRef.current = el;
    const onTime = () => setSt((s) => ({ ...s, position: el.currentTime }));
    const onMeta = () => setSt((s) => ({ ...s, duration: el.duration }));
    const onWait = () => setSt((s) => ({ ...s, loading: true }));
    const onCan = () => setSt((s) => ({ ...s, loading: false }));
    const onErr = () =>
      setSt((s) => ({ ...s, loading: false, playing: false, error: "پخش صدا ناموفق بود — اتصال یا قاری دیگری را بررسی کنید" }));
    const onEnd = () => {
      const cur = stRef.current;
      if (repeatRef.current === "ayah" && el.src) {
        el.currentTime = 0;
        void el.play();
        return;
      }
      const idx = ayahsRef.current.findIndex((a) => a.n === cur.ayahN);
      const nxt = ayahsRef.current[idx + 1];
      if (nxt && autoNextRef.current) {
        playAyahRef.current(nxt.n, true);
      } else if (!nxt && repeatRef.current === "surah" && ayahsRef.current[0]) {
        playAyahRef.current(ayahsRef.current[0].n, true);
      } else {
        setSt((s) => ({ ...s, playing: false }));
      }
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("waiting", onWait);
    el.addEventListener("canplay", onCan);
    el.addEventListener("error", onErr);
    el.addEventListener("ended", onEnd);
    return () => {
      el.pause();
      for (const ev of ["timeupdate", "loadedmetadata", "waiting", "canplay", "error", "ended"])
        el.removeEventListener(ev, onTime);
    };
  }, []);

  const stRef = useRef(st);
  stRef.current = st;
  const repeatRef = useRef(settings.repeatMode);
  repeatRef.current = settings.repeatMode;
  const autoNextRef = useRef(settings.autoPlayNext);
  autoNextRef.current = settings.autoPlayNext;

  const playAyah = useCallback(
    (ayahN: number, autoplay = true) => {
      const el = elRef.current;
      const first = ayahsRef.current[0];
      if (!el || !first) return;
      const surahId = Number(first.key.split(":")[0]);
      const key = `${surahId}:${ayahN}`;
      const start = (url: string) => {
        setSt((s) => ({ ...s, surahId, ayahN, loading: true, error: null, position: 0, duration: 0 }));
        el.src = url;
        el.playbackRate = useQuranStore.getState().settings.playbackRate;
        if (autoplay) {
          el.play().then(
            () => setSt((s) => ({ ...s, playing: true })),
            () => setSt((s) => ({ ...s, playing: false })) // autoplay blocked; user presses play
          );
        }
        const prevLast = useQuranStore.getState().last;
        setLast({
          surahId,
          ayahN,
          surahNameFa: prevLast?.surahId === surahId ? prevLast.surahNameFa : "",
          ts: Date.now(),
        });
      };
      const url = opts.audioMap[key];
      if (!url) {
        setSt((s) => ({ ...s, error: "این آیه برای قاری انتخاب‌شده موجود نیست" }));
        return;
      }
      // offline first: if this ayah is downloaded, play from IndexedDB
      import("@/lib/offline-audio")
        .then((m) => m.getAudioBlob(key, useQuranStore.getState().settings.reciterId))
        .then((blob) => {
          if (blob) start(URL.createObjectURL(blob));
          else start(url);
        })
        .catch(() => start(url));
    },
    [opts.audioMap, setLast]
  );
  playAyahRef.current = playAyah;

  const play = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    if (!el.src) {
      const first = ayahsRef.current[0];
      if (first) playAyah(first.n);
      return;
    }
    el.play().then(
      () => setSt((s) => ({ ...s, playing: true })),
      () => setSt((s) => ({ ...s, error: "پخش شروع نشد — دوباره تلاش کنید" }))
    );
  }, [playAyah]);

  const pause = useCallback(() => {
    elRef.current?.pause();
    setSt((s) => ({ ...s, playing: false }));
  }, []);

  const toggle = useCallback(() => (stRef.current.playing ? pause() : play()), [pause, play]);

  const seek = useCallback((t: number) => {
    if (elRef.current) elRef.current.currentTime = t;
  }, []);

  const setRate = useCallback(
    (rate: number) => {
      setSetting("playbackRate", rate);
      if (elRef.current) elRef.current.playbackRate = rate;
    },
    [setSetting]
  );

  const next = useCallback(() => {
    const idx = ayahsRef.current.findIndex((a) => a.n === stRef.current.ayahN);
    const nxt = ayahsRef.current[idx + 1];
    if (nxt) playAyah(nxt.n);
  }, [playAyah]);

  const prev = useCallback(() => {
    const idx = ayahsRef.current.findIndex((a) => a.n === stRef.current.ayahN);
    const prv = ayahsRef.current[idx - 1];
    if (prv) playAyah(prv.n);
  }, [playAyah]);

  const stop = useCallback(() => {
    const el = elRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
    }
    setSt({ playing: false, surahId: null, ayahN: null, loading: false, duration: 0, position: 0, error: null });
  }, []);

  return { st, playAyah, play, pause, toggle, seek, setRate, next, prev, stop };
}
