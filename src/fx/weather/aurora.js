import { ramp, at, clamp, tileNoise, smooth, TAU, hex } from "../../core/index.js";
import { box, clip } from "./_lib.js";

export const meta = {
  name: "Aurora",
  desc: "Northern lights over a night sky: two curtains ripple and fold, bright green hems fading up into violet, rays shimmering along them.",
  tags: ["weather", "aurora", "night", "sky", "lights", "glow", "ambient", "loop"],
  size: [128, 72],
  origin: [64, 36],
  duration: 8,
  loop: true,
  fps: 30,
  bg: "sky",
  options: {
    palette: ["#0a2a2a", "#0e4a3c", "#1a7a50", "#2eb064", "#6ae08a", "#c4ffcc", "#f4fff4"],
    top: ["#2a1450", "#5a2a8a", "#9a4ab8"],
    seed: 109,
  },
};

// two curtains: base height, fold sizes and speeds (whole turns a loop), ray height, brightness
const CURTAINS = [
  { y: -10, a1: 6, a2: 2.5, f1: 0.045, f2: 0.11, m1: 1, m2: 2, h: 18, k: 0.7, s: 0 },
  { y: 8, a1: 5, a2: 2.5, f1: 0.055, f2: 0.13, m1: -1, m2: 3, h: 24, k: 1, s: 1 },
];

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), TOP = ramp(o.top), S = o.seed, B = box(meta), ph = t / meta.duration;
  for (const cu of CURTAINS) {
    // everything but the height above the hem depends only on the column: work it out once per column
    const cols = [];
    for (let cx = B.x0; cx <= B.x1; cx++) {
      const x = cx + 0.5, u = (x - B.x0) / B.w;
      // the hem: slow folds travelling along the curtain
      const hem = cu.y + Math.sin(x * cu.f1 + ph * TAU * cu.m1 + cu.s * 2) * cu.a1 + Math.sin(x * cu.f2 - ph * TAU * cu.m2 + cu.s) * cu.a2;
      // rays: fine vertical striations sliding along the curtain, and broader swells of brightness
      const fine = tileNoise(u * 48 + ph * 48 * (cu.s ? -1 : 1), ph * 2, 48, 2, S + cu.s);
      const broad = tileNoise(u * 6 - ph * 6, 0.5 + cu.s * 3, 6, 0, S + 7 + cu.s);
      const env = smooth(0, 0.15, u) * smooth(1, 0.85, u) * 0.35 + 0.65; // dimmer toward the frame edges
      cols.push({ hem, fine, tall: cu.h * (0.75 + 0.35 * broad), k: (0.62 + 0.38 * fine) * (0.8 + 0.2 * broad) * env * cu.k });
    }
    const reach = cu.a1 + cu.a2;
    p.shade(B.x0, Math.max(B.y0, cu.y - reach - cu.h * 1.5), B.x1, Math.min(B.y1, cu.y + reach + 1), (x, y, out) => {
      const c = cols[Math.floor(x) - B.x0];
      if (!c) return;
      const d = c.hem - y; // height above the hem
      if (d < -1 || d > c.tall * 1.5) return;
      const v = clamp(d / c.tall), I = (d < 0 ? 0.7 : Math.exp(-v * 2.4)) * c.k;
      if (I < 0.07) return;
      // the glow fades from green up into violet; only the bright part is drawn as pixels
      out.l = v > 0.5 ? TOP[2] : C[3];
      out.k = I > 0.25 ? 0.24 + I * 0.2 : I * 1.1;
      if (I > 0.62 && d < 2.5) return d < 1 ? C[6] : C[5];
      if (I > 0.46) return c.fine > 0.25 ? C[4] : C[3];
      if (I > 0.26 && c.fine > 0.4) return v > 0.5 ? TOP[1] : C[2];
    });
  }
  // a faint glow off the lights over the whole sky
  p.glow(-10, -4, 70, C[3], 0.08);
}
