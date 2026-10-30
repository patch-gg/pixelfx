// Shared by the holy effects: plus signs, feathers, and the generic helpers the arcane effects use.
// Files starting with _ are helpers, not effects.

import { WHITE } from "../../core/index.js";
export { fit, sparkle, ovalLine, tiltedOval, silhouette, ahead } from "../arcane/_lib.js";

// Light ramps for things that are white rather than gold: feathers, wings.
export const FEATHER = ["#2a2440", "#4d4566", "#7f7898", "#b5b0c8", "#e4e1ee", "#fffdf6"];

// Plus signs: o is the outline (dark step), a the body, w the hot middle.
const PLUS = [
  ["a"],
  [".a.", "awa", ".a."],
  ["..a..", "..a..", "aawaa", "..a..", "..a.."],
  ["..ooo..", "..oao..", "oooaooo", "oaawaao", "oooaooo", "..oao..", "..ooo.."],
];

/** A plus sign centred on (x, y). size 0..3 (1 px, 3 px, 5 px, 7 px with an outline). C: [outline, body, core]. */
export function plus(p, x, y, size, C, a = 1) {
  const s = Math.max(0, Math.min(3, Math.round(size))), g = PLUS[s], h = g.length >> 1;
  p.sprite(g, { o: C[0], a: C[1], w: C[2] ?? WHITE }, Math.round(x) - h, Math.round(y) - h, { a });
}

// Feathers in three directions (tip right, tip up-right, tip up); mirroring gives the other three.
// w vane, s shaded vane, r the rachis, q the quill.
const FEATHERS = [
  ["...wwww.", "qrrrrrrw", "..ssss.."],
  ["....ww", "...wwr", "..wwrs", ".wrss.", ".rs...", "q....."],
  [".w.", "wwr", "wrs", "wrs", "wrs", ".rs", ".r.", ".q."],
];

/**
 * A small feather centred near (x, y), pointing along `ang` (radians, 0 = right, y down) snapped to the
 * nearest of eight directions. F: a feather ramp (dark to light, at least 4 steps).
 */
export function feather(p, x, y, ang, F, a = 1) {
  const k = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8; // 0 right, 2 down, 4 left, 6 up
  const pal = { w: F[F.length - 1], s: F[F.length - 3], r: F[F.length - 2], q: F[1] };
  // [sprite, mirror left-right, mirror top-bottom] for each of the eight directions
  const [base, flip, down] = [
    [FEATHERS[0], false, false], [FEATHERS[1], false, true], [FEATHERS[2], false, true], [FEATHERS[1], true, true],
    [FEATHERS[0], true, false], [FEATHERS[1], true, false], [FEATHERS[2], false, false], [FEATHERS[1], false, false],
  ][k];
  const rows = down ? flipV(base) : base;
  const w = rows[0].length, h = rows.length;
  p.sprite(rows, pal, Math.round(x - w / 2), Math.round(y - h / 2), { flip, a });
}

const flipped = new Map();
function flipV(rows) {
  if (!flipped.has(rows)) flipped.set(rows, [...rows].reverse());
  return flipped.get(rows);
}

