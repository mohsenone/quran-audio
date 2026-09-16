// Generate PNG icons (192/512) + favicon from the SVG design, pure JS (same writer as shahnameh).
// Run: node make-icons.mjs
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";

function png(size, draw) {
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x / size, y / size);
      const i = (y * size + x) * 4;
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
    }
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  let crcTable;
  const crc32 = (buf) => {
    if (!crcTable) {
      crcTable = [];
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        crcTable[n] = c >>> 0;
      }
    }
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const u = (v, s) => v * s;
// palette
const BG_TOP = [15, 138, 108], BG_BOT = [10, 92, 71];
const PAGE_TOP = [255, 253, 246], PAGE_BOT = [243, 236, 216];
const GOLD = [201, 164, 74], INK = [138, 122, 85], DARK = [10, 92, 71];

function inRounded(uu, vv, r) {
  const cx = Math.min(Math.max(uu, r), 1 - r), cy = Math.min(Math.max(vv, r), 1 - r);
  return (uu >= r && uu <= 1 - r) || (vv >= r && vv <= 1 - r) || Math.hypot(uu - cx, vv - cy) <= r;
}
const lerp = (a, b, t) => a + (b - a) * t;

function draw(uu, vv) {
  const s = 512;
  const U = u(uu, s), V = u(vv, s);
  if (!inRounded(uu, vv, 112 / s)) return [0, 0, 0, 0];
  const out = (c, a = 255) => [c[0], c[1], c[2], a];
  // bg gradient
  const bg = [lerp(BG_TOP[0], BG_BOT[0], vv), lerp(BG_TOP[1], BG_BOT[1], vv), lerp(BG_TOP[2], BG_BOT[2], vv)];
  // concentric circles (subtle)
  const d0 = Math.hypot(U - 256, V - 256);
  let c = bg;
  if (Math.abs(d0 - 190) < 3 || Math.abs(d0 - 150) < 3) c = [bg[0] + 8, bg[1] + 8, bg[2] + 8];
  // dome (arch): center 256, from y=96..204, half-width depends: arch shape
  const archTop = 96, archBot = 204;
  if (V >= archTop && V <= archBot) {
    // dome: half-circle r=70 centered (256,166) + legs down to 204
    const inDome = V >= 96 && V <= 166 && Math.hypot(U - 256, V - 166) <= 70;
    const inLegs = V > 166 && V <= 204 && Math.abs(U - 256) <= 70;
    if (inDome || inLegs) {
      // border ~5px gold, inner cream
      const inDome2 = V >= 96 + 5 && V <= 166 && Math.hypot(U - 256, V - 166) <= 65;
      const inLegs2 = V > 166 && V <= 204 && Math.abs(U - 256) <= 65;
      if (inDome2 || inLegs2) {
        // inner decorations: vertical stroke + curve
        if (Math.abs(U - 256) < 4.5 && V >= 118 && V <= 174) return out(DARK);
        const cv = Math.abs(Math.abs(U - 256) - 28);
        if (V > 140 && V < 156 && cv < 10 && Math.abs(V - 148) < 6 * (1 - cv / 10)) return out(DARK);
        return out(PAGE_BOT);
      }
      return out(GOLD);
    }
  }
  // book: y from ~300 to 404. Two pages meeting at spine x=256
  if (V >= 300 && V <= 404) {
    // page top curve: y = 320 - parabola dips to 306 at spine
    const leftEdge = 96 + (V - 320) * 0.12, rightEdge = 416 - (V - 320) * 0.12;
    const topY = (side) => 320 - 14 * Math.exp(-(((U - 256) / (side * 80)) ** 2));
    const top = U < 256 ? topY(-1) : topY(1);
    const botY = (side) => 394 + 10 * Math.exp(-(((U - 256) / (side * 80)) ** 2));
    const bot = U < 256 ? botY(-1) : botY(1);
    if (V >= top && V <= bot && U >= leftEdge && U <= rightEdge) {
      // gold outline zone (6px at edges/spine)
      const nearTop = V - top < 6, nearBot = bot - V < 6, nearSpine = Math.abs(U - 256) < 6;
      const nearSide = Math.min(U - leftEdge, rightEdge - U) < 6;
      if (nearTop || nearBot || nearSpine || nearSide) return out(GOLD);
      // text lines
      const relL = (V - 352) / 26; // two line bands
      const band1 = V >= 350 && V <= 357, band2 = V >= 376 && V <= 383;
      if (band1 || band2) {
        const withinL = U >= 124 && U <= 240, withinR = U >= 272 && U <= 388;
        if (withinL || withinR) return out(INK);
      }
      // page shading by depth
      const t = (V - top) / Math.max(1, bot - top);
      return out([lerp(PAGE_TOP[0], PAGE_BOT[0], t), lerp(PAGE_TOP[1], PAGE_BOT[1], t), lerp(PAGE_TOP[2], PAGE_BOT[2], t)]);
    }
    // clasp
    if (U >= 246 && U <= 266 && V >= 330 && V <= 388) return out(GOLD);
  }
  return out(c);
}

for (const s of [192, 512]) {
  writeFileSync(`public/icon-${s}.png`, png(s, draw));
  console.log(`icon-${s}.png written`);
}
writeFileSync("src/app/icon.png", png(64, draw));
console.log("src/app/icon.png written");
