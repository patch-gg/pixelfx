import { PAL, bump, TAU } from "../../core/index.js";
import { Layer, shadow, twinkle, bob, fit } from "./_lib.js";

export const meta = {
  name: "Crystal shard",
  desc: "A tall six-sided crystal turning slowly in the air, lit from within, three splinters orbiting it, behind and in front.",
  tags: ["pickup", "crystal", "mana", "magic", "loop"],
  size: [40, 50],
  origin: [20, 46],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.cyber, shards: 3, shadow: true, seed: 3 },
};

const L = new Layer(32, 40);
const N = 6, STEP = TAU / N;
const LX = -0.6, LY = -0.4, LZ = 0.69;
const SPLINTER = [".c.", "cbb", "bba", ".a."];

function body(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration, th = ph * STEP * 4;
  const cy = Math.round(-24 + bob(ph, 2.5)), TIP = cy - 14, SH = cy - 8, BASE = cy + 5, END = cy + 10;
  const prof = (y) =>
    y < SH ? [5 * ((y - TIP) / (SH - TIP)), 0.62] : y < BASE ? [5 - 0.6 * ((y - SH) / (BASE - SH)), 0] : [4.4 * (1 - (y - BASE) / (END - BASE)), -0.65];
  L.begin(-12, TIP - 3);
  L.fill(-8, TIP, 8, END, (x, y) => {
    if (y < TIP || y > END) return 0;
    const [r, tilt] = prof(y);
    if (r <= 0.3) return 0;
    const s = x / r;
    for (let k = 0; k < N; k++) {
      const a0 = th + k * STEP, mid = a0 + STEP / 2;
      if (Math.cos(mid) <= 0) continue;
      const x0 = Math.sin(a0), x1 = Math.sin(a0 + STEP);
      if (s < x0 || s >= x1) continue;
      const ct = Math.cos(tilt), nx = Math.sin(mid) * ct, ny = -Math.sin(tilt), nz = Math.cos(mid) * ct;
      const b = nx * LX + ny * LY + nz * LZ; // about -0.4 (facing away) .. 1 (facing the light)
      const seam = Math.min(s - x0, x1 - s) * r < 0.55 ? 1 : 0; // a bright line where two faces meet
      const step = (b > 0.8 ? 5 : b > 0.45 ? 4 : b > 0 ? 3 : 2) + seam;
      return C[Math.min(6, step)];
    }
    return 0;
  });
  L.outline(C[1]);
  L.draw(p);
  return { C, cy, ph, TIP, SH };
}

// three splinters ride an ellipse around it, behind on the far side and in front on the near side
function splinters(p, t, o, front) {
  const C = fit(o.palette), ph = t / meta.duration, cy = Math.round(-24 + bob(ph, 2.5));
  for (let i = 0; i < o.shards; i++) {
    const a = ph * TAU + (i * TAU) / o.shards, depth = Math.sin(a);
    if (depth >= 0 !== front) continue;
    const x = Math.round(Math.cos(a) * 13), y = Math.round(cy + 2 + depth * 4 + Math.sin(a * 2 + i) * 1.5);
    p.sprite(SPLINTER, front ? { a: C[2], b: C[4], c: C[6] } : { a: C[1], b: C[2], c: C[4] }, x - 1, y - 2);
    p.light(x, y, C[5], front ? 0.35 : 0.15);
  }
}

export function drawBack(p, t, o) {
  splinters(p, t, o, false);
}

export function draw(p, t, o) {
  const { C, cy, ph, TIP } = body(p, t, o);
  splinters(p, t, o, true);
  const g = bump(ph, 0.3, 0.5);
  if (g > 0) {
    twinkle(p, -2, TIP + 3, 1 + Math.round(g * 3.5), C[5], C[6]);
    p.light(-2, TIP + 3, C[6], 0.6 * g);
  }
  const pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  p.glow(0, cy - 3, 26, C[4], 0.14 * pulse);
  p.glow(0, cy - 2, 8, C[6], 0.1 * pulse);
  if (o.shadow) shadow(p, 0, 5 + bob(ph, 0.8));
}
