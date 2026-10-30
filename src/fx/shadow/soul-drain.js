import { cycle, ease, bump, clamp, tileNoise, at, TAU } from "../../core/index.js";
import { steps, shape } from "./_lib.js";

export const meta = {
  name: "Soul drain",
  desc: "Pale souls are torn from the right and dragged along a funnel of violet streaks into a dark vessel that flares as it feeds.",
  tags: ["shadow", "drain", "soul", "ghost", "channel", "directional", "loop"],
  size: [90, 36],
  origin: [11, 18],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0a0614", "#1c0e36", "#341a5c", "#4a3a8a", "#5a72b4", "#7cb4dc", "#c4ecf8", "#ffffff"],
    length: 70, count: 5, seed: 9,
  },
};

const SOUL = [".###.", "#####", "#e#e#", "#####", "#.#.#"];

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, D = meta.duration, ph = t / D, L = o.length;
  const center = (x) => Math.sin(x * 0.085 - 0.4 + ph * TAU) * 4.5 * Math.pow(clamp(x / L), 0.7);
  const width = (x) => 1.2 + 5 * clamp(x / L);
  const STREAM = C.slice(1, 6);

  // the stream: a funnel of streaks flowing toward the vessel (noise scrolls two whole tiles a loop)
  p.shade(0, -12, L + 6, 12, (x, y) => {
    const cy = center(x), v = Math.abs(y - cy) / width(x);
    if (v > 1.3) return;
    const n = tileNoise(x * 0.16 + ph * 32, (y - cy) * 0.7 + 9, 16, 0, S);
    const fade = clamp((L + 6 - x) / 12);
    const val = ((1 - v) * 0.85 + n * 0.55) * fade;
    if (val < 0.3) return;
    return at(STREAM, (val - 0.3) * 1.25 + (x < 12 ? (12 - x) / 20 : 0));
  });

  // souls: pulled out slowly, then faster, stretching into sparks at the end
  let feed = 0;
  cycle(t, D, o.count, S, (r) => r.range(1.15, 1.5), (age, life, r) => {
    const k = age / life, x0 = L + r.range(-3, 3), off = r.range(-3.5, 3.5);
    const pos = (kk) => {
      const e = ease.inQuad(kk), x = x0 * (1 - e);
      return [x, center(x) + off * (1 - e) * Math.min(1, x / 20)];
    };
    const [x, y] = pos(k);
    feed = Math.max(feed, bump(k, 0.84, 1));
    // a wavering tail behind it
    for (let j = 5; j >= 1; j--) {
      const [tx, ty] = pos(Math.max(0, k - j * 0.022));
      p.px(tx + 2, ty + Math.round(Math.sin(age * 18 + j * 1.3) * 0.7), j > 3 ? C[4] : C[5]);
    }
    if (k < 0.8) {
      const a = clamp(k / 0.08);
      shape(p, SOUL, Math.round(x) - 2, Math.round(y) - 2, (ch, mx, my) => (ch === "e" ? C[2] : my === 0 || (my === 1 && mx < 3) ? C[7] : C[6]), a);
      p.light(x, y, C[6], 0.3 * a);
    } else {
      p.line(x, y, x + 3, y, (u) => (u < 0.4 ? C[7] : C[5]));
      p.light(x, y, C[7], 0.6);
    }
  });

  // the vessel: a dark orb, lit on the side facing the stream, flaring each time a soul lands
  const R = 3.2 + feed * 1.2;
  p.circle(0, 0, R + 1, (d, a) => (d > 0.74 && Math.cos(a) > -0.3 ? C[6] : d > 0.74 ? C[4] : C[1]));
  p.circle(-0.5, -0.5, R * 0.45, feed > 0.6 ? C[7] : C[0]);
  if (feed > 0.4) {
    const s = 2 + feed * 4;
    p.line(-R - s, 0, -R - 1, 0, C[6]), p.line(0, -R - s, 0, -R - 1, C[6]), p.line(0, R + 1, 0, R + s, C[6]);
  }
  p.glow(0, 0, 14 + feed * 10, C[5], 0.28 + feed * 0.3);
  p.glow(L * 0.55, 0, 28, C[3], 0.1);
}
