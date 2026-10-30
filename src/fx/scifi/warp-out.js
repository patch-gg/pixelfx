import { burst, seg, ease, rand, stockActor, TAU, WHITE } from "../../core/index.js";
import { steps, maskCells } from "./_lib.js";

export const meta = {
  name: "Warp out",
  desc: "A body flares into a silhouette of light, comes apart into motes from the feet up, and they stream up a thin beam that snaps shut with a glint.",
  tags: ["scifi", "teleport", "warp", "despawn", "beam", "one-shot"],
  size: [48, 84],
  origin: [24, 78],
  duration: 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0a1430", "#14306a", "#2060b0", "#3aa0e0", "#80dcff", "#d0f6ff", "#ffffff"], height: 76, seed: 24 },
};

// the stand-in body this effect takes apart: the caller's actor if given, else the stock one
let stock = null;
const body = (o) => o.actor ?? (stock ??= stockActor());

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, A = body(o), H = o.height, beat = Math.floor(t * 20);

  // the beam the motes ride up: thin, brightening, then drawn up off the floor and pinched shut
  const on = seg(t, 0.2, 0.3), lift = ease.inQuad(seg(t, 0.62, 0.8));
  if (on > 0 && lift < 1) {
    const hw = on < 0.5 ? 0.5 : 2.5, bottom = -lift * H;
    p.shade(-hw - 0.5, -H - 2, hw + 0.5, bottom, (x, y, out) => {
      const v = Math.abs(x) / hw;
      if (v > 1) return;
      out.c = on < 0.5 ? C[5] : v < 0.4 ? WHITE : C[5];
    });
    p.glowLine(0, -H, 0, bottom, 10, C[4], 0.35 * on);
  }
  // the body: a white flare, then shimmering light; each pixel breaks loose (feet first) and is pulled up
  for (const [x, y, mx, my] of maskCells(A)) {
    const go = 0.1 + 0.42 * (0.65 * (1 - my / A.h) + 0.35 * rand(S, mx, my));
    if (t < go) {
      const twinkle = rand(S, mx, my, beat) < 0.2;
      p.px(x, y, t < 0.05 ? WHITE : go - t < 0.06 ? WHITE : twinkle ? C[4] : C[5]);
      continue;
    }
    const age = t - go, life = 0.3 + 0.12 * rand(S, mx, my, 2);
    if (age > life) continue;
    const k = age / life, px = x * 1.4 * (1 - k), py = y - 18 * age - 520 * age * age;
    if (py < -H) continue;
    p.line(px, py, px, py + 1 + 4 * k, k < 0.25 ? WHITE : k < 0.6 ? C[4] : C[3]);
  }
  if (t < 0.12) p.outline(A.mask, A.x, A.y, t < 0.05 ? C[5] : C[4]);

  // rings rising up the body as it goes
  for (let i = 0; i < 2; i++) {
    const k = seg(t, 0.06 + i * 0.12, 0.42 + i * 0.12);
    if (k <= 0 || k >= 1) continue;
    const y = -ease.inOutSine(k) * (A.h + 4), rx = 9 - 2 * k;
    for (let j = 0; j < 36; j++) {
      const a = (j / 36) * TAU;
      p.px(Math.cos(a) * rx, y + Math.sin(a) * 2, Math.sin(a) > 0 ? (k < 0.6 ? C[6] : C[5]) : C[4]);
    }
  }

  // the glint where it closes
  const gl = seg(t, 0.78, 0.98);
  if (gl > 0 && gl < 1) {
    const s = Math.round(6 * Math.sin(Math.PI * gl));
    p.line(-s, -H + 4, s, -H + 4, C[6]);
    p.line(0, -H + 4 - Math.round(s / 2), 0, -H + 4 + Math.round(s / 2), C[6]);
    p.px(0, -H + 4, WHITE);
    p.glow(0, -H + 4, 12, C[5], 0.5 * Math.sin(Math.PI * gl));
  }

  // the floor ring where the body stood, fading
  const fr = seg(t, 0, 0.7);
  if (fr < 1) {
    const rx = 8 + 6 * ease.outCubic(fr);
    for (let j = 0; j < 40; j++) {
      const a = (j / 40) * TAU;
      if (fr > 0.5 && j % 2) continue;
      p.px(Math.cos(a) * rx, Math.sin(a) * rx * 0.22, fr < 0.3 ? C[6] : C[4]);
    }
  }
  p.glow(0, -10, 24, C[4], 0.4 * (1 - seg(t, 0.1, 0.8)));

  // a few last motes drifting up after the beam is gone
  burst(6, S + 5, (r) => {
    const born = r.range(0.7, 0.85), age = t - born, life = r.range(0.25, 0.35);
    if (age < 0 || age > life) return;
    p.px(r.range(-6, 6), r.range(-30, -8) - age * 30, age / life < 0.5 ? C[5] : C[3]);
  });
}
