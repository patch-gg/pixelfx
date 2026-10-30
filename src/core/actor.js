// A stock character to try effects on: status effects wrap its silhouette, hits land on it, auras sit
// behind it. Previews and the gallery draw it; effects only read its mask through o.actor.

const HERO = [
  "....kkkkk...",
  "..kkhhhhhk..",
  ".khhhhhhhhk.",
  ".khhhhhhhhhk",
  ".khhssssshhk",
  ".khsessesshk",
  ".khsessesshk",
  "..ksssssssk.",
  "...kkSSSkk..",
  "..kttttttk..",
  ".kttTttTttk.",
  ".ksttTTttsk.",
  ".kstttttttk.",
  "..kbbbbbbk..",
  "..kppkkppk..",
  "..kppk.kppk.",
  "..kppk.kppk.",
  "..koook.kook",
  "..kkkkk.kkkk",
];
const HERO_PAL = {
  k: "#17121f", h: "#7a4128", s: "#f3c49d", S: "#c98b6c", e: "#17121f",
  t: "#5f6f94", T: "#46536f", b: "#8a5a32", p: "#38334a", o: "#6a4030",
};

function maskOf(rows, k = 1) {
  const h = rows.length * k, w = rows[0].length * k, data = new Uint8Array(w * h);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === ".") return;
    for (let j = 0; j < k * k; j++) data[(y * k + ((j / k) | 0)) * w + x * k + (j % k)] = 1;
  }));
  return { w, h, data };
}

const MASKS = { 1: maskOf(HERO, 1), 2: maskOf(HERO, 2) };

/**
 * The stock actor at scale k (1: 12 x 19 px, 2: 24 x 38 px), in local space with its feet at (0, 0):
 * { mask, x, y (top-left of the mask), w, h, k, head: [x, y] (top of the head), chest: [x, y] }.
 */
export function stockActor(k = 1) {
  const m = MASKS[k] ?? (MASKS[k] = maskOf(HERO, k)), x = -Math.floor(m.w / 2), y = -m.h;
  return { mask: m, x, y, w: m.w, h: m.h, k, head: [0, y], chest: [0, y + 11 * k] };
}

/** Draw the stock actor with its feet at the painter's origin, at alpha a (dithered). */
export function drawActor(p, actor = stockActor(), a = 1) {
  if (a > 0) p.sprite(HERO, HERO_PAL, actor.x, actor.y, { a, scale: actor.k ?? 1 });
}
/** How visible an effect wants the stand-in character at time t (effects may export actorAlpha). */
export const actorAlphaOf = (mod, t, o) => (typeof mod.actorAlpha === "function" ? mod.actorAlpha(t, o) : 1);

export { HERO, HERO_PAL };
