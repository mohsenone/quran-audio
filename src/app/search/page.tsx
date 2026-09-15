"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { searchQuran, FA_TRANSLATIONS } from "@/lib/api";
import { useQuranStore } from "@/lib/store";
import type { SearchResult } from "@/types/quran";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/Bits";
import { debounce, faNum } from "@/lib/utils";

export default function SearchPage() {
  const settings = useQuranStore((s) => s.settings);
  const [mode, setMode] = useState<"arabic" | "translation">("arabic");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const seq = useRef(0);

  const run = async (query: string) => {
    const mySeq = ++seq.current;
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const r = await searchQuran(query, settings.translationId, mode);
      if (seq.current === mySeq) setResults(r);
    } catch {
      if (seq.current === mySeq) setError(true);
    } finally {
      if (seq.current === mySeq) setLoading(false);
    }
  };
  const runDebounced = useRef(debounce(run, 400));

  useEffect(() => {
    runDebounced.current(q);
  }, [q, mode]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">جستجو</h1>

      <div className="mb-3 flex rounded-xl border border-line" role="group" aria-label="حالت جستجو">
        {(
          [
            ["arabic", "متن عربی"],
            ["translation", "ترجمه فارسی"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setMode(v)}
            className={`flex-1 px-3 py-2 text-sm ${mode === v ? "bg-accent-soft font-medium text-accent" : "text-ink2"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <SearchIcon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={mode === "arabic" ? "جستجو در متن عربی…" : "جستجو در ترجمه فارسی…"}
          aria-label="عبارت جستجو"
          dir={mode === "arabic" ? "rtl" : "rtl"}
          className="w-full rounded-xl border border-line bg-surface px-10 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      {loading && (
        <div className="py-8 text-center">
          <Spinner />
        </div>
      )}
      {error && !loading && <ErrorState message="جستجو ناموفق بود — اتصال اینترنت را بررسی کنید" onRetry={() => run(q)} />}
      {!loading && !error && results !== null && results.length === 0 && (
        <EmptyState message="نتیجه‌ای یافت نشد — عبارت دیگری را امتحان کنید" />
      )}

      <ul className="space-y-2">
        {(results ?? []).map((r) => (
          <li key={r.key}>
            <Link
              href={`/quran/${r.surahId}#ayah-${r.n}`}
              className="block rounded-xl border border-line bg-surface p-4 hover:border-accent"
            >
              <p className="mb-1 text-xs text-ink2">
                سوره {r.surahNameFa} — آیه {faNum(r.n)}
              </p>
              {mode === "arabic" ? (
                <p dir="rtl" lang="ar" className="quran" style={{ fontSize: "20px" }}>
                  {r.text}
                </p>
              ) : (
                <p dir="rtl" className="leading-7 text-ink">
                  {r.translation}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
