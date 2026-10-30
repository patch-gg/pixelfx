import { PAL, RAMP, cycle, fract, clamp, tileNoise, TAU, WHITE } from "../../core/index.js";
import { fit, rune, sparkle } from "./_lib.js";

export const meta = {
  name: "Enchant",
  desc: "An enchanted sword: a violet aura licks up the blade, a ring of runes wraps round it and turns, a white sheen runs from hilt to tip.",
  tags: ["arcane", "enchant", "weapon", "sword", "buff", "item", "loop"],
  size: [40, 64],
  origin: [20, 59],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.arcane, sword: true, seed: 19 },
};

const M = RAMP.metal, G = RAMP.gold, W = RAMP.wood;
const TIP = -50, GUARD = -13;
// half-width of the blade at height y (tapering to a point)
const half = (y) => (y < TIP || y > GUARD - 1 ? -1 : y < TIP + 1 ? 0 : y < TIP + 4 ? 1 : 2);

function sword(p, ph, C) {
  // blade: dark edges, a bright left bevel, the fuller down the middle; a sheen band sweeps up it once a loop
  const sheen = -8 - 56 * fract(ph + 0.35);
  for (let y = TIP; y <= GUARD - 1; y++) {
    const w = half(y);
    for (let x = -w; x <= w; x++) {
      let c = Math.abs(x) === w && w > 0 ? M[2] : x < 0 ? M[6] : x === 0 ? M[4] : M[3];
      if (w === 0) c = M[5];
      const s = y - x - sheen;
      if (Math.abs(s) < 1.2) c = WHITE;
      else if (Math.abs(s) < 2.6 && Math.abs(x) < w) c = C[6];
      p.px(x, y, c);
    }
  }
  // guard, grip, pommel
  for (let x = -6; x <= 6; x++) {
    p.px(x, GUARD, Math.abs(x) === 6 ? G[3] : G[5]);
    p.px(x, GUARD + 1, Math.abs(x) === 6 ? G[2] : G[3]);
  }
  p.px(-6, GUARD - 1, G[4]);
  p.px(6, GUARD - 1, G[3]);
  for (let y = GUARD + 2; y <= -4; y++) for (let x = -1; x <= 1; x++) p.px(x, y, (y + (x > 0 ? 1 : 0)) % 2 ? W[3] : W[2]);
  for (let y = -3; y <= -1; y++) for (let x = -1; x <= 1; x++) p.px(x, y, y === -2 && x === 0 ? C[6] : y === -3 ? G[5] : G[3]);
}

// the rune ring: glyphs at fixed heights orbiting the blade in a spiral, a full turn each loop
function runes(p, ph, C, front) {
  for (let i = 0; i < 6; i++) {
    const th = ph * TAU + i * 2.1, depth = Math.cos(th), y = -18 - i * 5.5;
    if (depth >= 0 !== front) continue;
    const x = Math.sin(th) * 8.5;
    if (front) rune(p, i + 2, x, y, depth > 0.75 ? WHITE : C[6], 1, true, C[1]);
    else rune(p, i + 2, x, y, C[3], 1, true);
    if (front) p.light(x, y, C[5], 0.35);
  }
}

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, ph = t / meta.duration;
  runes(p, ph, C, false);
  // the aura: a 1 px glowing rim hugging the blade, with violet flames licking up off it
  p.shade(-6, TIP - 6, 6, GUARD, (x, y, out) => {
    const yy = Math.floor(y), xx = Math.floor(x), w = Math.max(half(yy), half(yy + 2) - 1);
    const d = w < 0 ? 9 : xx >= 0 ? xx - w : -xx - 1 - w; // pixels out from the blade edge
    const tipd = TIP - yy; // above the tip
    const lick = tileNoise(x * 0.9, y * 0.16 + ph * 6, 0, 6, S) * 0.5 + 0.5; // tall tongues, rising
    const wave = 0.5 + 0.5 * Math.sin(y * 0.3 + ph * TAU * 2);
    if ((d === 1 && w >= 0) || (tipd > 0 && tipd <= 1 && Math.abs(xx + 0.5) < 1)) {
      out.c = wave > 0.75 ? C[6] : C[5];
      out.k = 0.2;
      return;
    }
    if ((d === 2 || d === 3 || (tipd > 1 && tipd < 6 && Math.abs(xx + 0.5) < 2)) && lick > 0.55 + (d - 2) * 0.14 + Math.max(0, tipd) * 0.04) {
      out.c = lick > 0.7 && d === 2 ? C[4] : C[3];
    }
  });
  if (o.sword) sword(p, ph, C);
  runes(p, ph, C, true);
  // motes peeling off the blade and drifting up
  cycle(t, meta.duration, 8, S, (r) => r.range(0.5, 0.9), (age, life, r) => {
    const k = age / life, side = r.sign(), y0 = r.range(TIP + 4, GUARD - 4);
    const x = side * (3 + age * r.range(6, 12)), y = y0 - age * r.range(10, 18);
    sparkle(p, x, y, k > 0.2 && k < 0.5 ? 1 : 0, C[5], C[5], k < 0.6 ? C[6] : C[5]);
  });
  const pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  p.glowLine(0, TIP, 0, GUARD, 10, C[4], 0.22 * pulse);
  p.glow(0, -2, 6, C[5], 0.3 * clamp(pulse));
}
