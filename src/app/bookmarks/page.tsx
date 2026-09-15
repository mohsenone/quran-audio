"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useQuranStore } from "@/lib/store";
import { EmptyState } from "@/components/ui/Bits";
import { faNum } from "@/lib/utils";

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, setBookmarkNote } = useQuranStore();
  const [q, setQ] = useState("");

  const filtered = bookmarks.filter(
    (b) => !q.trim() || b.arabic.includes(q) || (b.translation ?? "").includes(q) || b.surahNameFa.includes(q)
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">نشان‌شده‌ها</h1>

      {bookmarks.length > 0 && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجو در نشان‌ها…"
          aria-label="جستجو در نشان‌ها"
          className="mb-4 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
      )}

      {bookmarks.length === 0 && <EmptyState message="هنوز آیه‌ای نشان نکرده‌اید — در صفحه قرآن روی نشانگر بزنید" />}
      {bookmarks.length > 0 && filtered.length === 0 && <EmptyState message="نشی مطابق جستجو یافت نشد" />}

      <ul className="space-y-3">
        {filtered.map((b) => (
          <li key={b.key} className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <Link href={`/quran/${b.surahId}#ayah-${b.n}`} className="text-sm font-medium text-accent hover:underline">
                سوره {b.surahNameFa} — آیه {faNum(b.n)}
              </Link>
              <button
                onClick={() => removeBookmark(b.key)}
                aria-label="حذف نشان"
                className="rounded-lg p-1.5 text-ink2 hover:bg-surface2 hover:text-red-500"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <p dir="rtl" lang="ar" className="quran" style={{ fontSize: "22px" }}>
              {b.arabic}
            </p>
            {b.translation && <p dir="rtl" className="mt-2 text-sm leading-7 text-ink2">{b.translation}</p>}
            <input
              defaultValue={b.note ?? ""}
              onBlur={(e) => setBookmarkNote(b.key, e.target.value.trim() || "")}
              placeholder="یادداشت…"
              aria-label={`یادداشت برای آیه ${b.n}`}
              className="mt-3 w-full rounded-lg border border-line bg-surface2 px-3 py-1.5 text-xs outline-none focus:border-accent"
            />
            <p className="mt-1 text-[10px] text-ink2">
              {new Date(b.createdAt).toLocaleDateString("fa-IR")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
