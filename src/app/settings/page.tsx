"use client";

import { useQuranStore, DEFAULT_SETTINGS, type Theme, type DisplayMode } from "@/lib/store";
import { FA_TRANSLATIONS, TAFSIRS } from "@/lib/api";
import { cn } from "@/lib/utils";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-0">
      <span className="shrink-0 text-sm">{label}</span>
      <div className="flex flex-wrap justify-end gap-1.5">{children}</div>
    </div>
  );
}

function Choice<T extends string | number>({
  value,
  current,
  onPick,
  label,
}: {
  value: T;
  current: T;
  onPick: (v: T) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onPick(value)}
      aria-pressed={current === value}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm",
        current === value ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-ink2"
      )}
    >
      {label}
    </button>
  );
}

export default function SettingsPage() {
  const { settings, setSetting } = useQuranStore();

  const reset = () => {
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      setSetting(k as keyof typeof DEFAULT_SETTINGS, v as never);
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">تنظیمات</h1>

      <section className="rounded-2xl border border-line bg-surface px-4" aria-label="نمایش قرآن">
        <Row label="پوسته">
          {([["light", "روشن"], ["dark", "تاریک"], ["system", "سیستم"]] as [Theme, string][]).map(([v, l]) => (
            <Choice key={v} value={v} current={settings.theme} onPick={(x) => setSetting("theme", x)} label={l} />
          ))}
        </Row>
        <Row label="محتوای آیه">
          {(
            [
              ["arabic", "فقط عربی"],
              ["arabic-translation", "عربی + ترجمه"],
              ["full", "عربی + ترجمه + تفسیر"],
            ] as [DisplayMode, string][]
          ).map(([v, l]) => (
            <Choice key={v} value={v} current={settings.displayMode} onPick={(x) => setSetting("displayMode", x)} label={l} />
          ))}
        </Row>
        <Row label="اندازه متن قرآن">
          {([1, 2, 3, 4] as const).map((v) => (
            <Choice
              key={v}
              value={v}
              current={settings.fontSize}
              onPick={(x) => setSetting("fontSize", x)}
              label={["کوچک", "متوسط", "بزرگ", "خیلی بزرگ"][v - 1]}
            />
          ))}
        </Row>
        <Row label="ترجمه فارسی">
          {FA_TRANSLATIONS.map((t) => (
            <Choice key={t.id} value={t.id} current={settings.translationId} onPick={(x) => setSetting("translationId", x)} label={t.name} />
          ))}
        </Row>
        <Row label="تفسیر">
          {TAFSIRS.map((t) => (
            <Choice key={t.id} value={t.id} current={settings.tafsirId} onPick={(x) => setSetting("tafsirId", x)} label={t.name} />
          ))}
        </Row>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface px-4" aria-label="صوت">
        <Row label="سرعت پخش پیش‌فرض">
          {[0.75, 1, 1.25, 1.5, 2].map((r) => (
            <Choice key={r} value={r} current={settings.playbackRate} onPick={(x) => setSetting("playbackRate", x)} label={`${r}×`} />
          ))}
        </Row>
        <Row label="پخش خودکار آیه بعدی">
          <Choice
            value={"on"}
            current={settings.autoPlayNext ? "on" : "off"}
            onPick={() => setSetting("autoPlayNext", true)}
            label="روشن"
          />
          <Choice
            value={"off"}
            current={settings.autoPlayNext ? "on" : "off"}
            onPick={() => setSetting("autoPlayNext", false)}
            label="خاموش"
          />
        </Row>
        <Row label="خواندن ترجمه بعد از آیه (صوتی)">
          <Choice
            value={"on"}
            current={settings.speakTranslation ? "on" : "off"}
            onPick={() => setSetting("speakTranslation", true)}
            label="روشن"
          />
          <Choice
            value={"off"}
            current={settings.speakTranslation ? "on" : "off"}
            onPick={() => setSetting("speakTranslation", false)}
            label="خاموش"
          />
        </Row>
        <Row label="تکرار">
          {([["none", "بدون"], ["ayah", "آیه"], ["surah", "سوره"]] as const).map(([v, l]) => (
            <Choice key={v} value={v} current={settings.repeatMode} onPick={(x) => setSetting("repeatMode", x)} label={l} />
          ))}
        </Row>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface px-4" aria-label="درباره">
        <Row label="بازنشانی تنظیمات">
          <button
            onClick={reset}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink2 hover:border-red-400 hover:text-red-500"
          >
            بازنشانی
          </button>
        </Row>
        <Row label="حالت آفلاین">
          <a href="/downloads" className="text-sm text-accent hover:underline">
            مدیریت دانلودها
          </a>
        </Row>
      </section>
    </div>
  );
}
