"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSurahs } from "@/lib/api";
import type { Surah } from "@/types/quran";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/Bits";
import { faNum } from "@/lib/utils";

export default function QuranIndexPage() {
  const [surahs, setSurahs] = useState<Surah[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [place, setPlace] = useState<"all" | "makkah" | "madinah">("all");

  const load = () => {
    setError(false);
    setSurahs(null);
    getSurahs()
      .then(setSurahs)
      .catch(() => setError(true));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!surahs) return [];
    const needle = q.trim();
    return surahs.filter(
      (s) =>
        (place === "all" || s.place === place) &&
        (!needle ||
          s.nameFa.includes(needle) ||
          s.nameArabic.includes(needle) ||
          s.nameSimple.toLowerCase().includes(needle.toLowerCase()) ||
          String(s.id) === needle)
    );
  }, [surahs, q, place]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">قرآن</h1>

      <div className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی سوره…"
          aria-label="جستجوی سوره"
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <div className="flex shrink-0 rounded-xl border border-line" role="group" aria-label="فیلتر مکی/مدنی">
          {(
            [
              ["all", "همه"],
              ["makkah", "مکی"],
              ["madinah", "مدنی"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setPlace(v)}
              className={`px-3 text-sm ${place === v ? "bg-accent-soft font-medium text-accent" : "text-ink2"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {surahs === null && !error && (
        <div className="py-10 text-center">
          <Spinner />
        </div>
      )}
      {error && <ErrorState message="فهرست سوره‌ها بارگذاری نشد" onRetry={load} />}
      {surahs !== null && filtered.length === 0 && <EmptyState message="سوره‌ای یافت نشد" />}

      <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {filtered.map((s) => (
          <li key={s.id}>
            <Link href={`/quran/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-accent">
                {faNum(s.id)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{s.nameFa}</span>
                <span className="block truncate text-xs text-ink2">
                  {s.nameArabic} · {faNum(s.versesCount)} آیه · {s.place === "makkah" ? "مکی" : "مدنی"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
