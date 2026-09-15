// Offline audio store: fetch per-ayah mp3s -> IndexedDB blobs. Full-surah audio
// files are huge; per-ayah matches the player model exactly.
"use client";

import { openDB, type IDBPDatabase } from "idb";

interface AudioDB {
  audio: { key: string; blob: Blob; ts: number };
  meta: { key: string; done: number; total: number; ts: number };
}

let dbp: Promise<IDBPDatabase<AudioDB>> | null = null;
function db() {
  if (!dbp)
    dbp = openDB<AudioDB>("quran-audio-offline", 1, {
      upgrade(d) {
        d.createObjectStore("audio", { keyPath: "key" });
        d.createObjectStore("meta", { keyPath: "key" });
      },
    });
  return dbp;
}

export const audioKey = (surahId: number, reciterId: number) => `s${surahId}-r${reciterId}`;

export async function downloadSurahAudio(
  surahId: number,
  reciterId: number,
  files: Record<string, string>,
  onProgress: (done: number, total: number) => void
): Promise<void> {
  const keys = Object.keys(files);
  const d = await db();
  await d.put("meta", { key: audioKey(surahId, reciterId), done: 0, total: keys.length, ts: Date.now() });
  let done = 0;
  for (const key of keys) {
    const stored = await d.get("audio", `${key}-r${reciterId}`);
    if (!stored) {
      const res = await fetch(files[key]);
      if (!res.ok) throw new Error(`fetch ${key} ${res.status}`);
      const blob = await res.blob();
      await d.put("audio", { key: `${key}-r${reciterId}`, blob, ts: Date.now() });
    }
    done++;
    await d.put("meta", { key: audioKey(surahId, reciterId), done, total: keys.length, ts: Date.now() });
    onProgress(done, keys.length);
  }
}

export async function getAudioBlob(verseKey: string, reciterId: number): Promise<Blob | undefined> {
  const d = await db();
  return (await d.get("audio", `${verseKey}-r${reciterId}`))?.blob;
}

export async function getOfflineProgress(surahId: number, reciterId: number) {
  const d = await db();
  return d.get("meta", audioKey(surahId, reciterId));
}

export async function listDownloads() {
  const d = await db();
  return d.getAll("meta");
}

export async function deleteSurahAudio(surahId: number, reciterId: number, verseKeys: string[]) {
  const d = await db();
  for (const key of verseKeys) await d.delete("audio", `${key}-r${reciterId}`);
  await d.delete("meta", audioKey(surahId, reciterId));
}

export async function clearAllAudio() {
  const d = await db();
  await d.clear("audio");
  await d.clear("meta");
}

export async function audioStorageUsed(): Promise<number> {
  if (navigator.storage?.estimate) {
    const e = await navigator.storage.estimate();
    return e.usage ?? 0;
  }
  return 0;
}
