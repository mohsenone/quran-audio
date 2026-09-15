"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getReciters } from "@/lib/api";
import { useQuranStore } from "@/lib/store";
import type { Reciter } from "@/types/quran";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/Bits";
import { cn } from "@/lib/utils";

export default function RecitersPage() {
  const { settings, setSetting } = useQuranStore();
  const [reciters, setReciters] = useState<Reciter[] | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setReciters(null);
    getReciters()
      .then(setReciters)
      .catch(() => setError(true));
  };
  useEffect(load, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">قاریان</h1>

      {reciters === null && !error && (
        <div className="py-10 text-center">
          <Spinner />
        </div>
      )}
      {error && <ErrorState message="فهرست قاریان بارگذاری نشد" onRetry={load} />}
      {reciters !== null && reciters.length === 0 && <EmptyState message="قاری‌ای در دسترس نیست — اتصال را بررسی کنید" />}

      <ul className="space-y-2">
        {(reciters ?? []).map((r) => {
          const active = settings.reciterId === r.id;
          return (
            <li key={r.id}>
              <button
                onClick={() => setSetting("reciterId", r.id)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border bg-surface p-4 text-right",
                  active ? "border-accent" : "border-line hover:border-accent"
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent">
                  {r.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{r.name}</span>
                  {r.style && <span className="block text-xs text-ink2">{r.style}</span>}
                </span>
                {active && <Check className="size-5 text-accent" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
