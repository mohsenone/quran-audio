"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, Search, Bookmark, Mic2, Download, Settings, Moon, Sun, Monitor,
} from "lucide-react";
import { useQuranStore, applyTheme, type Theme } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useOnline } from "@/hooks/useOnline";

const NAV = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/quran", label: "قرآن", icon: BookOpen },
  { href: "/search", label: "جستجو", icon: Search },
  { href: "/bookmarks", label: "نشان‌ها", icon: Bookmark },
  { href: "/reciters", label: "قاریان", icon: Mic2 },
  { href: "/downloads", label: "دانلودها", icon: Download },
  { href: "/settings", label: "تنظیمات", icon: Settings },
];

const MOBILE = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[6]];

function ThemeButtons() {
  const theme = useQuranStore((s) => s.settings.theme);
  const setSetting = useQuranStore((s) => s.setSetting);
  const opts: { v: Theme; icon: typeof Sun; label: string }[] = [
    { v: "light", icon: Sun, label: "روشن" },
    { v: "dark", icon: Moon, label: "تاریک" },
    { v: "system", icon: Monitor, label: "سیستم" },
  ];
  return (
    <div className="flex gap-1">
      {opts.map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          aria-label={`پوسته ${label}`}
          title={`پوسته ${label}`}
          onClick={() => setSetting("theme", v)}
          className={cn(
            "rounded-lg p-2 text-ink2 hover:bg-surface2 hover:text-ink",
            theme === v && "bg-accent-soft text-accent"
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const online = useOnline();

  return (
    <div className="flex min-h-dvh">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-l border-line bg-surface px-3 py-5 md:flex">
        <Link href="/" className="mb-6 px-2 text-xl font-bold text-accent">
          قرآن صوت
        </Link>
        <nav aria-label="ناوبری اصلی" className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-ink2 hover:bg-surface2 hover:text-ink",
                pathname === href && "bg-accent-soft font-medium text-accent"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between px-2 pt-4">
          <span className={cn("text-xs", online ? "text-ink2" : "text-gold")} aria-live="polite">
            {online ? "آنلاین" : "آفلاین"}
          </span>
          <ThemeButtons />
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="md:hidden">
          <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
            <Link href="/" className="text-lg font-bold text-accent">
              قرآن صوت
            </Link>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs", online ? "text-ink2" : "text-gold")}>{online ? "آنلاین" : "آفلاین"}</span>
              <ThemeButtons />
            </div>
          </div>
        </div>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-32 pt-5 md:max-w-4xl md:pb-28">{children}</main>

        {/* mobile bottom nav */}
        <nav
          aria-label="ناوبری"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          {MOBILE.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-ink2",
                pathname === href && "text-accent"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
