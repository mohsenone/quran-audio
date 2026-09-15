// Self-check: bookmarks dedupe/note/remove + last-activity (pure store logic).
// Run: node --experimental-strip-types test_store.mjs
import { useQuranStore } from "./src/lib/store.ts";

const s = useQuranStore.getState();
const bm = {
  key: "2:255", surahId: 2, surahNameFa: "بقره", n: 255,
  arabic: "الله لا اله الا", translation: "خداست که...", createdAt: 1,
};

s.toggleBookmark(bm);
s.toggleBookmark({ ...bm }); // dedupe check
let st = useQuranStore.getState();
console.assert(st.bookmarks.length === 0, "FAIL: toggle twice should remove");

s.toggleBookmark(bm);
s.setBookmarkNote("2:255", "آیه الکرسی");
st = useQuranStore.getState();
console.assert(st.bookmarks.length === 1 && st.bookmarks[0].note === "آیه الکرسی", "FAIL: note");

s.removeBookmark("2:255");
st = useQuranStore.getState();
console.assert(st.bookmarks.length === 0, "FAIL: remove");

s.setLast({ surahId: 2, ayahN: 255, surahNameFa: "بقره", ts: Date.now() });
console.assert(useQuranStore.getState().last?.ayahN === 255, "FAIL: last activity");

console.assert(st.settings.reciterId === 7, "FAIL: default reciter");
console.log("store self-check: OK");
