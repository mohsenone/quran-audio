"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
}

const DISMISS_KEY = "install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(true);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    if (standalone || localStorage.getItem(DISMISS_KEY)) return;

    // event may fire before hydration — inline script in layout stashes it
    const stashed = (window as any).__bip as BIPEvent | undefined;
    if (stashed) setEvt(stashed);

    const onBip = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setEvt(null);
      setHidden(true);
    };
    addEventListener("beforeinstallprompt", onBip);
    addEventListener("appinstalled", onInstalled);

    // iOS Safari: no install prompt — show manual hint instead
    if (!stashed) {
      const timer = setTimeout(() => {
        if (!evt && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
          setIosHint(true);
          setHidden(false);
        }
      }, 4000);
      return () => {
        clearTimeout(timer);
        removeEventListener("beforeinstallprompt", onBip);
        removeEventListener("appinstalled", onInstalled);
      };
    }
    setHidden(false);
    return () => {
      removeEventListener("beforeinstallprompt", onBip);
      removeEventListener("appinstalled", onInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (evt) setHidden(false);
  }, [evt]);

  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    dismiss();
  };

  return (
    <div
      className="fixed bottom-24 left-3 right-3 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-accent bg-surface p-3 shadow-lg md:bottom-6 md:left-6 md:right-auto"
      role="dialog"
      aria-label="نصب برنامه"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
        <Download className="size-5 text-accent" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{iosHint ? "افزودن به صفحه اصلی" : "نصب قرآن صوت"}</p>
        <p className="truncate text-xs text-ink2">
          {iosHint ? "از منوی Share ← Add to Home Screen" : "دسترسی سریع‌تر، آفلاین، بدون مرورگر"}
        </p>
      </div>
      {iosHint ? (
        <button onClick={dismiss} aria-label="بستن" className="rounded-lg p-2 text-ink2 hover:bg-surface2">
          <X className="size-4" />
        </button>
      ) : (
        <>
          <button
            onClick={install}
            disabled={!evt}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-sm font-medium text-white",
              evt ? "bg-accent" : "bg-ink2/40"
            )}
          >
            نصب
          </button>
          <button onClick={dismiss} aria-label="بستن" className="rounded-lg p-1.5 text-ink2 hover:bg-surface2">
            <X className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
