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

function maskOf(rows) {
  const h = rows.length, w = rows[0].length, data = new Uint8Array(w * h);
  rows.forEach((r, y) => [...r].forEach((ch, x) => (data[y * w + x] = ch === "." ? 0 : 1)));
  return { w, h, data };
}

const MASK = maskOf(HERO);

/**
 * The stock actor, in local space with its feet at (0, 0):
 * { mask, x, y (top-left of the mask), w, h, head: [x, y] (top of the head), chest: [x, y] }.
 */
export function stockActor() {
  const x = -Math.floor(MASK.w / 2), y = -MASK.h;
  return { mask: MASK, x, y, w: MASK.w, h: MASK.h, head: [0, y], chest: [0, y + 11] };
}

/** Draw the stock actor with its feet at the painter's origin, at alpha a (dithered). */
export function drawActor(p, actor = stockActor(), a = 1) {
  if (a > 0) p.sprite(HERO, HERO_PAL, actor.x, actor.y, { a });
}
/** How visible an effect wants the stand-in character at time t (effects may export actorAlpha). */
export const actorAlphaOf = (mod, t, o) => (typeof mod.actorAlpha === "function" ? mod.actorAlpha(t, o) : 1);

export { HERO, HERO_PAL };
