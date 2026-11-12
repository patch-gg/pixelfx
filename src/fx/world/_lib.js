// The map kit: a map bakes its static layers once (sky, distance, masonry, floor, foreground) and then draws them
// with fast blits, leaving only ambient motion per frame. Everything here is deterministic and loop-safe.
//
// A map is a 320 x 180 arena, the size of the game's screen. Draw the read-at-a-glance layer first: a readable floor
// line at map.groundY, a dark band under it, a light rim on top, and a quiet strip where the fight will happen. Put
// detail in the edges and the distance, not under the characters.

import { createFrame, clearFrame, painterFor, hex, mix, clamp, lerp, rand, rng, cycle, TAU, tileNoise } from "../../core/index.js";

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const dither = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];

/** Bake a static layer: draw it once with the full Painter API and keep its color and light buffers. */
export function bake(w, h, fn) {
  const f = createFrame(w, h);
  const p = painterFor(clearFrame(f));
  p.place(0, 0);
  fn(p, f);
  return { w, h, color: f.color, light: f.light };
}

/** Draw a baked layer: color first, then its baked lights added on top. */
export function blit(p, layer) {
  p.image(layer.color, layer.w, layer.h, 0, 0);
  p.lightImage(layer.light, layer.w, layer.h, 0, 0);
}

/** A stepped vertical gradient with ordered dither at each step. */
export function sky(p, w, h, top, low, { horizon = h, steps = 6, seed = 0 } = {}) {
  const rows = Math.max(1, horizon);
  for (let y = 0; y < h; y++) {
    const u = clamp(y / rows), q = clamp(u * steps + dither(0, y) / steps - 0.08), c = mix(top, low, clamp(q / steps));
    for (let x = 0; x < w; x++) p.px(x, y, c);
  }
}

/** Sparse stars in the upper sky, with a few brighter ones and a soft halo. */
export function stars(p, w, h, seed = 0, count = 90, maxY = h * 0.55, color = "#d8d4ff") {
  const c = hex(color);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand(seed, i, 1) * w), y = Math.floor(rand(seed, i, 2) * maxY), r = rand(seed, i, 3);
    p.px(x, y, r > 0.94 ? hex("#ffffff") : c);
    if (r > 0.985) {
      p.dot(x - 1, y, c, 0.55); p.dot(x + 1, y, c, 0.55); p.dot(x, y - 1, c, 0.55); p.dot(x, y + 1, c, 0.55);
      p.glow(x, y, 5, c, 0.35);
    }
  }
}

/** A moon: a pale disc with craters, a one-pixel bright rim and a wide low halo. */
export function moon(p, x, y, r, core, halo, seed = 0) {
  for (let yy = -r - 1; yy <= r + 1; yy++)
    for (let xx = -r - 1; xx <= r + 1; xx++) {
      const d = Math.hypot(xx, yy) / r;
      if (d > 1) continue;
      let c = core;
      if (d > 0.86) c = mix(core, halo, 0.5);
      const n = rand(Math.floor(xx + x), Math.floor(yy + y), seed);
      if (n > 0.86) c = mix(c, halo, 0.25);
      p.px(x + xx, y + yy, c);
    }
  p.glow(x, y, r * 3.2, halo, 0.3);
  p.glow(x, y, r * 1.15, core, 0.14);
}

/** A far ridge or hill silhouette, filling down from a noisy skyline to baseY. */
export function ridge(p, w, baseY, amp, color, seed = 0, step = 1) {
  const c = hex(color);
  let y = baseY;
  for (let x = 0; x < w; x += step) {
    if (step === 1 || x % 1 === 0) {
      const n = tileNoise(x / 26, 0.5, 0, 0, seed) * amp + tileNoise(x / 9, 0.5, 0, 0, seed + 7) * amp * 0.35;
      y = Math.round(baseY - Math.abs(n));
      for (let yy = y; yy < Math.min(180, baseY + 60); yy++) p.px(x, yy, c);
    }
  }
  return y;
}

/** A clump of leaves or foliage: dark under-shape, mid body, lit top-left rim, a few notches. */
export function foliage(p, x, y, rx, ry, C, seed = 0, n = 7) {
  p.ellipse(x, y, rx, ry, C[1]);
  for (let i = 0; i < n; i++) {
    const a = rand(seed, i, 1) * TAU, d = rand(seed, i, 2), r = 2 + rand(seed, i, 3) * rx * 0.42;
    const px = x + Math.cos(a) * rx * 0.62 * d, py = y + Math.sin(a) * ry * 0.62 * d;
    p.disc(px, py, r, C[2], 0.9);
    if (rand(seed, i, 4) > 0.45) p.disc(px - r * 0.25, py - r * 0.35, r * 0.55, C[3], 0.85);
  }
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / n) * Math.PI, px = x + Math.cos(a) * rx * 0.85, py = y + Math.sin(a) * ry * 0.8;
    p.dot(px, py, C[3], 0.9);
  }
}

/**
 * A ruined wall with a pointed doorway: a jagged broken top, stone courses, a thick arch ring and moss. It is
 * background architecture, dark enough that characters passing in front still read.
 */
export function arch(p, x, baseY, w, h, C, { broken = true, seed = 0 } = {}) {
  const top = baseY - h, pw = Math.max(5, Math.round(w * 0.15));
  const ix0 = x + pw + Math.round(w * 0.12), ix1 = x + w - pw - Math.round(w * 0.12), iw = Math.max(1, ix1 - ix0);
  const springY = top + Math.round(h * 0.52), apexY = top + Math.round(h * 0.2), ring = Math.max(4, Math.round(w * 0.075));
  const openingTop = (px) => {
    const u = clamp((px - ix0) / (iw - 1), 0, 1);
    return Math.round(apexY + Math.pow(Math.abs(u - 0.5) * 2, 1.8) * (springY - apexY));
  };
  // the broken skyline: the wall stands higher in some places and is missing in others
  const wallTop = (px) => {
    if (!broken) return top;
    const n = Math.sin(px * 0.19 + seed * 1.7) * 4 + Math.sin(px * 0.07 + seed) * 6 + rand(seed, px, 3) * 8;
    return Math.round(top - 4 + n);
  };
  // stone courses and joints
  for (let px = x; px < x + w; px++) {
    const wt = wallTop(px);
    for (let py = wt; py < baseY; py++) {
      const row = Math.floor((py - top) / 7), off = row % 2 ? 4 : 0;
      let c = C[2];
      if ((px + off) % 12 === 0 || (py - top) % 7 === 6) c = C[1];
      else if ((px * 5 + py * 3 + seed) % 29 === 0) c = C[3];
      else if (py < wt + 2) c = C[3];
      p.px(px, py, c);
    }
  }
  // the doorway: a pointed opening, dark inside
  for (let px = ix0; px < ix1; px++) {
    const ot = openingTop(px);
    for (let py = ot; py < baseY; py++) p.px(px, py, C[0]);
    // the arch ring around it: lit on the outer edge, deep in the shadow under it
    for (let k = 1; k <= ring; k++) {
      let c = k === 1 ? C[5] : k === 2 ? C[4] : k === ring ? C[1] : C[2];
      if ((px + k) % 9 === 0) c = C[1];
      p.px(px, ot - k, c);
    }
  }
  // jambs: a lit outside edge, a deep reveal inside
  for (const [jx, dir] of [[ix0 - 1, -1], [ix1, 1]]) {
    for (let py = springY - 2; py < baseY; py++) {
      p.px(jx, py, C[4]);
      p.px(jx + dir, py, C[1]);
      if (py % 7 === 0) p.px(jx, py, C[2]);
    }
  }
  // a long crack down the wall, skipping left or right as it falls
  let cx = x + Math.round(w * (broken ? 0.8 : 0.24)), cy = wallTop(cx) + 2;
  while (cy < baseY - 2) {
    p.px(cx, cy, C[0]); p.px(cx + 1, cy, C[1]);
    cy += 1;
    cx += Math.sin(cy * 0.7 + seed) > 0.3 ? 1 : rand(seed, cy, 9) > 0.6 ? -1 : 0;
  }
  // cap stones on the unbroken part, fallen stones below
  if (!broken) for (let px = x; px < x + w; px += 7) p.rect(px, wallTop(px) - 1, 6, 1, C[4]);
  if (broken) {
    for (let i = 0; i < 7; i++) {
      const bx = x + w * 0.4 + rand(seed, i, 1) * w * 0.55, by = baseY - 1 - rand(seed, i, 2) * 10;
      p.rect(bx, by, 2 + Math.floor(rand(seed, i, 3) * 4), 1 + Math.floor(rand(seed, i, 4) * 2), i % 3 ? C[2] : C[3]);
    }
  }
  // moss in the joints and ferns at the foot
  for (let i = 0; i < 22; i++) {
    const mx = x + 2 + rand(seed, i, 5) * (w - 4), my = baseY - 2 - rand(seed, i, 6) * Math.min(26, h * 0.6);
    p.dot(mx, my, i % 3 ? C[3] : C[4], 0.7);
  }
  for (let i = 0; i < 5; i++) fernlike(p, x + 4 + rand(seed, i, 7) * (w - 8), baseY - 1, 2, C, seed + i);
}

/** A few fern blades, used for mossy feet without importing the map kit's bigger fern. */
function fernlike(p, x, y, s, C, seed = 0) {
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i - 1.5) * 0.32, L = s * (2 + rand(seed, i, 1));
    for (let k = 1; k <= L; k++) p.px(x + Math.cos(a) * k, y + Math.sin(a) * k + k * k * 0.06, k > L * 0.7 ? C[4] : C[3]);
  }
}

/** A stone pillar with a base, capital and broken top. */
export function pillar(p, x, baseY, w, h, C, { broken = false } = {}) {
  const top = baseY - h;
  p.rect(x, top, w, h, C[2]);
  p.rect(x, top, 1, h, C[4]);
  p.rect(x + w - 2, top, 2, h, C[1]);
  for (let y = top + 4; y < baseY; y += 8) p.rect(x, y, w, 1, C[1]);
  for (let y = top + 2; y < baseY; y += 8) p.rect(x + 2, y, w - 4, 1, C[3]);
  p.rect(x - 2, baseY - 4, w + 4, 4, C[2]);
  p.rect(x - 2, baseY - 4, w + 4, 1, C[4]);
  if (broken) {
    for (let i = 0; i < 4; i++) p.dot(x + rand(3, i, 1) * w, top - 1, C[3], 0.7);
  } else {
    p.rect(x - 3, top - 4, w + 6, 4, C[2]);
    p.rect(x - 3, top - 4, w + 6, 1, C[4]);
    p.rect(x - 1, top, w + 2, 2, C[1]);
  }
}

/** The walkable floor: a lit grass/stone lip, a dark band under it, embedded stones, roots and cracks. */
export function ground(p, w, y, h, C, { grass = true, seed = 0, stone = false, lava = false } = {}) {
  const floor = hex(C[0]), dark = hex(C[1]), lit = hex(C[4]), rim = hex(C[5]);
  for (let yy = y; yy < h; yy++) {
    const d = yy - y;
    let c = d < 2 ? mix(floor, dark, 0.35) : d < 6 ? floor : mix(floor, dark, clamp((d - 5) / 18) * 0.75);
    for (let x = 0; x < w; x++) {
      const n = tileNoise(x / 4.5, d / 4.5, 0, 0, seed);
      if (n > 0.35 && d > 2) c = mix(c, lit, 0.18);
      if (n < -0.4 && d > 3) c = mix(c, dark, 0.4);
      p.px(x, yy, c);
    }
  }
  // the one-pixel rim reads at a glance; keep it unbroken
  for (let x = 0; x < w; x++) p.px(x, y, rim);
  for (let x = 0; x < w; x++) if ((x + seed) % 3 === 0) p.px(x, y + 1, mix(rim, lit, 0.35));
  if (grass) {
    for (let x = 0; x < w; x++) {
      const hgt = rand(seed, x, 7);
      if (hgt > 0.62) p.px(x, y - 1, hgt > 0.86 ? rim : lit);
      if (hgt > 0.9) p.px(x, y - 2, lit);
    }
    for (let i = 0; i < 35; i++) {
      const x = Math.floor(rand(seed, i, 11) * w), hh = 1 + Math.floor(rand(seed, i, 12) * 4);
      for (let k = 1; k <= hh; k++) p.px(x + (k > 2 ? 1 : 0), y - k, k === hh ? rim : lit);
    }
  }
  // stones pressed into the earth, and a few roots or cracks
  for (let i = 0; i < 24; i++) {
    const x = Math.floor(rand(seed, i, 21) * w), yy = y + 3 + Math.floor(rand(seed, i, 22) * Math.max(1, Math.min(22, h - y - 5)));
    const ww = 1 + Math.floor(rand(seed, i, 23) * 4);
    p.rect(x, yy, ww, 1, mix(floor, lit, 0.32));
    p.dot(x, yy + 1, dark, 0.8);
  }
  if (stone) {
    for (let x = 0; x < w; x += 16) {
      p.rect(x, y + 6, 1, h - y - 6, dark);
      p.rect(x + 1, y + 6, 15, 1, mix(floor, lit, 0.2));
    }
    for (let x = 8; x < w; x += 16) p.rect(x, y + 15, 1, h - y - 15, dark);
  }
  if (lava) {
    for (let i = 0; i < 10; i++) {
      let x = Math.floor(rand(seed, i, 31) * w), yy = y + 4 + Math.floor(rand(seed, i, 32) * 20);
      for (let k = 0; k < 6; k++) {
        p.px(x, yy, C[5]);
        p.px(x + 1, yy, C[4]);
        p.glow(x, yy, 4, C[4], 0.35);
        x += rand(seed, i, 40 + k) > 0.5 ? 1 : -1;
        yy += rand(seed, i, 50 + k) > 0.5 ? 1 : 0;
      }
    }
  }
}

/** Grass blades and tiny flowers poking above the floor line, in front of characters' feet. */
export function tufts(p, w, y, C, seed = 0, count = 26) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand(seed, i, 1) * w), hh = 2 + Math.floor(rand(seed, i, 2) * 5);
    for (let k = 1; k <= hh; k++) p.px(x + Math.round(k * 0.35), y - k, k === hh ? C[5] : C[4]);
    if (rand(seed, i, 3) > 0.72) p.px(x + 1, y - hh - 1, C[6] ?? C[5]);
  }
}

/** A mushroom: stem, cap, lit cap rim and a little glow. */
export function mushroom(p, x, y, s, C) {
  p.rect(x, y - s * 1.6, Math.max(1, Math.round(s * 0.5)), Math.round(s * 1.6), C[5]);
  p.rect(x, y - Math.round(s * 1.6), Math.max(1, Math.round(s * 0.5)), 1, C[6]);
  p.ellipse(x + s * 0.25, y - s * 1.9, s * 1.1, s * 0.62, C[6]);
  p.ellipse(x + s * 0.25, y - s * 1.75, s * 0.85, s * 0.35, C[7]);
  p.dot(x + s * 0.6, y - s * 2.05, C[6], 0.9);
  p.glow(x + s * 0.25, y - s * 2, s * 2.4, C[5], 0.1);
}

/** A fern: a fan of arching fronds, brighter on top, with a few dark gaps. */
export function fern(p, x, y, s, C, seed = 0) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42 + (rand(seed, i, 1) - 0.5) * 0.1, L = s * (2.2 + rand(seed, i, 2) * 1.4);
    for (let k = 1; k <= L; k++) {
      const u = k / L, px = x + Math.cos(a) * k * (1 - u * 0.35), py = y + Math.sin(a) * k + u * u * L * 0.4;
      p.px(px, py, k > L * 0.7 ? C[5] : C[4]);
      if (k > 2 && k % 2 === 0) {
        p.px(px - 1, py, C[3]);
        if (k < L * 0.7) p.px(px + 1, py - 1, C[4]);
      }
    }
  }
}

/** Light that settles on a patch of floor: a wide low pool, a tighter bright one and a rim. */
export function pool(p, x, y, rx, C, k = 0.3) {
  p.glow(x, y - 1, rx * 1.6, C[3], k * 0.55);
  p.glow(x, y - 1, rx * 0.7, C[4], k * 0.7);
  p.glow(x, y - 1, rx * 0.3, C[5], k * 0.45);
}

/** Slow drifting cloud/fog bands over the sky, loop-safe. */
export function mist(p, t, D, { y0 = 60, y1 = 140, color = "#8fa8b8", seed = 0, bands = 3, alpha = 0.08 } = {}) {
  const c = hex(color), ph = (t / D) * 8;
  for (let b = 0; b < bands; b++) {
    const yy = Math.round(lerp(y0, y1, (b + 0.5) / bands));
    for (let y = yy - 6; y <= yy + 6; y++) {
      for (let x = 0; x < 320; x++) {
        const n = tileNoise(x / 38 + ph + b * 3.1, y / 7, 8, 0, seed + b * 11);
        const a = clamp((n - 0.05) * alpha * 1.8, 0, alpha);
        if (a > 0.008) p.blend(x, y, c, a);
      }
    }
  }
}

/** Fireflies on looping wandering paths: a dot, a twinkle and a small light, behind and in front. */
export function fireflies(p, t, D, { count = 14, x0 = 8, x1 = 312, y0 = 48, y1 = 146, color = "#d8ff8a", seed = 0 } = {}) {
  const c = hex(color), hot = mix(c, hex("#ffffff"), 0.55), ph = (t / D) * TAU;
  for (let i = 0; i < count; i++) {
    const g = rng(seed, i, 4), bx = lerp(x0, x1, g.next()), by = lerp(y0, y1, g.next());
    const x = bx + Math.sin(ph * (1 + (i % 3)) + i * 2.1) * (9 + g.next() * 9);
    const y = by + Math.cos(ph * (1 + ((i + 1) % 3)) + i * 1.7) * (4 + g.next() * 6);
    const tw = 0.5 + 0.5 * Math.sin(t * (2.2 + (i % 4) * 0.6) + i * 1.3);
    const a = 0.35 + tw * 0.65;
    if (x < 0 || y < 0 || x >= 320 || y >= 180) continue;
    p.dot(x, y, tw > 0.55 ? hot : c, a);
    if (tw > 0.75) p.dot(x - 1, y, c, 0.5), p.dot(x, y - 1, c, 0.5);
    p.glow(x, y, 4 + tw * 2, c, 0.14 * a);
  }
}

/** Falling leaves in a looping breeze; they flip between a pale back and a dark face. */
export function leaves(p, t, D, { count = 10, color = "#b8d98a", back, seed = 0, x0 = -10, x1 = 330, y0 = 12, y1 = 120 } = {}) {
  const c = hex(color), b = hex(back ?? "#e4ffb0"), ph = (t / D) * TAU;
  for (let i = 0; i < count; i++) {
    const g = rng(seed, i, 5), sx = lerp(x0, x1, g.next()), sy = lerp(y0, y1, g.next()), k = 0.6 + g.next() * 0.8;
    const x = sx + Math.sin(ph * 2 + i * 1.8) * (8 + g.next() * 10), y = sy + (((t / D) * 240 + i * 7) % 120);
    const flip = Math.sin((t / D) * TAU * 3 + i * 1.7);
    if (x < 0 || y < 0 || x + 1 >= 320 || y + 1 >= 180) continue;
    p.px(x, y, flip > 0 ? b : c);
    p.px(x + 1, y, c);
    if (Math.abs(flip) < 0.4) p.px(x, y + 1, c);
    if (Math.abs(flip) > 0.8) p.px(x + 1, y - 1, b);
  }
}

/** Embers rising off a hot floor, cooling from white through orange to deep red, with light. */
export function embers(p, t, D, { count = 18, color = "#ffb050", seed = 0, x0 = 0, x1 = 320, y0 = 148, y1 = 60 } = {}) {
  const c = hex(color);
  cycle(t, D, count, seed, (g) => 2.5 + g.next() * 4, (age, L, g, i) => {
    const k = age / L, bx = lerp(x0, x1, g.next()), x = bx + Math.sin(age * 2.3 + i) * 6 * k;
    const y = lerp(y0, y1, k) - k * k * 16;
    const a = Math.min(1, k * 8) * Math.min(1, (1 - k) * 3);
    const hot = k < 0.25 ? mix(c, hex("#fff6c4"), 0.65) : k < 0.65 ? c : mix(c, hex("#a8301a"), 0.5);
    if (x < 0 || y < 0 || x >= 320 || y >= 180) return;
    p.dot(x, y, hot, a);
    const x2 = x + Math.sin(age * 9 + i) * 1.4;
    if (k < 0.5 && x2 >= 0 && x2 < 320) p.dot(x2, y + 2, mix(c, hex("#701a14"), 0.4), a * 0.7);
    p.glow(x, y, 5 + (1 - k) * 4, hot, 0.25 * a);
  });
}

/** Dust motes drifting through the light, in and out of visibility. */
export function motes(p, t, D, { count = 24, color = "#e8e0c8", seed = 0, x0 = 0, x1 = 320, y0 = 20, y1 = 150 } = {}) {
  const c = hex(color);
  for (let i = 0; i < count; i++) {
    const g = rng(seed, i, 6), bx = lerp(x0, x1, g.next()), by = lerp(y0, y1, g.next());
    const x = bx + Math.sin((t / D) * TAU * (1 + (i % 3)) + i) * 5, y = by - (((t / D) * 68 + i * 13) % 34) + 17;
    const a = 0.16 + 0.18 * Math.sin((t / D) * TAU * 2 + i * 1.9);
    if (x < 0 || y < 0 || x >= 320 || y >= 180) continue;
    p.dot(x, y, c, a);
  }
}

/** A slow shaft of light from above, breathing at the loop's pace. */
export function shaft(p, t, D, { x, w = 22, y = 0, h = 150, color = "#fff0c4", seed = 0, k = 0.12 } = {}) {
  const c = hex(color), sway = Math.sin((t / D) * TAU) * 3;
  for (let yy = y; yy < y + h; yy++) {
    const u = (yy - y) / h, half = (w / 2) * (0.55 + u * 0.75);
    for (let xx = Math.round(x + sway * u - half); xx <= Math.round(x + sway * u + half); xx++) {
      const edge = 1 - Math.abs(xx - (x + sway * u)) / half;
      p.light(xx, yy, c, k * edge * (0.6 + 0.4 * Math.sin((t / D) * TAU * 2 + seed)));
    }
  }
}
