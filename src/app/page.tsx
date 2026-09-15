"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Bookmark, Search, Mic2, Download, History } from "lucide-react";
import { useQuranStore } from "@/lib/store";
import { getSurahs } from "@/lib/api";
import type { Surah } from "@/types/quran";
import { EmptyState } from "@/components/ui/Bits";
import { faNum } from "@/lib/utils";

const QUICK = [
  { href: "/quran", label: "قرآن", icon: BookOpen },
  { href: "/bookmarks", label: "نشان‌شده‌ها", icon: Bookmark },
  { href: "/search", label: "جستجو", icon: Search },
  { href: "/reciters", label: "قاریان", icon: Mic2 },
  { href: "/downloads", label: "دانلودها", icon: Download },
];

export default function HomePage() {
  const last = useQuranStore((s) => s.last);
  const [surahs, setSurahs] = useState<Surah[] | null>(null);

  useEffect(() => {
    getSurahs().then(setSurahs).catch(() => setSurahs([]));
  }, []);

  const lastSurah = last && surahs ? surahs.find((s) => s.id === last.surahId) : null;

  return (
    <div className="space-y-8">
      {/* Continue reading */}
      <section aria-label="ادامه خواندن">
        {last ? (
          <div className="rounded-2xl border border-accent bg-accent-soft p-5">
            <div className="mb-1 flex items-center gap-2 text-sm text-ink2">
              <History className="size-4" /> آخرین فعالیت شما
            </div>
            <p className="mb-3 text-lg font-semibold">
              سوره {last.surahNameFa || lastSurah?.nameFa || ""} — آیه {faNum(last.ayahN)}
            </p>
            <Link
              href={`/quran/${last.surahId}#ayah-${last.ayahN}`}
              className="inline-block rounded-xl bg-accent px-5 py-2.5 font-medium text-white"
            >
              ادامه خواندن
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center">
            <p className="mb-1 text-lg font-semibold">به قرآن صوت خوش آمدید</p>
            <p className="mb-4 text-sm text-ink2">قرآن را بخوانید، گوش دهید و نشان کنید — همه در یک جا</p>
            <Link href="/quran" className="inline-block rounded-xl bg-accent px-5 py-2.5 font-medium text-white">
              شروع قرائت
            </Link>
          </div>
        )}
      </section>

      {/* Quick access */}
      <section aria-label="دسترسی سریع">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {QUICK.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-3 text-xs text-ink2 hover:border-accent hover:text-accent"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Surah list */}
      <section aria-label="فهرست سوره‌ها">
        <h2 className="mb-3 font-semibold">سوره‌ها</h2>
        {surahs === null ? (
          <EmptyState message="در حال بارگذاری…" />
        ) : surahs.length === 0 ? (
          <EmptyState message="فهرست سوره‌ها در دسترس نیست — اتصال اینترنت را بررسی کنید" />
        ) : (
          <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {surahs.map((s) => (
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
        )}
      </section>
    </div>
  );
}
