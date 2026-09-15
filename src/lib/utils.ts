import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function faNum(n: number | string): string {
  return Number(n).toLocaleString("fa-IR");
}

export function placeLabel(place: string): string {
  return place === "makkah" ? "مکی" : "مدنی";
}

export function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout> | undefined;
  return ((...args: never[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function stripDiacritics(s: string): string {
  return s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "");
}
