import { PAL, burst, seg, ease, WHITE } from "../../core/index.js";
import { fit, ripple, landTime } from "./_lib.js";

export const meta = {
  name: "Puddle step",
  desc: "A foot slaps down in a puddle: a white slap, two low fans of water flung out sideways, droplets pattering down and rings running out.",
  tags: ["water", "puddle", "step", "footstep", "splash", "one-shot"],
  size: [64, 32],
  origin: [32, 26],
  duration: 0.7,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.water, size: 1, seed: 15 },
};

const G = 520;

// the puddle and its rings lie under the feet; the far half of the spray goes behind the character
export function drawBack(p, t, o) {
  const W = fit(o.palette), k = o.size, gone = ease.inQuad(seg(t, 0.4, 0.7));
  const rx = 15 * k * (1 - gone);
  if (rx > 1) p.ellipse(0, 0.5, rx, 2.8 * k * (1 - gone * 0.5), (d, a) => (d > 0.82 ? (Math.sin(a) < 0 ? W[4] : W[2]) : W[2]));
  for (const [t0, life, r1] of [[0.02, 0.45, 20], [0.12, 0.45, 14]]) {
    const u = seg(t, t0, t0 + life);
    if (u <= 0 || u >= 1) continue;
    const r = (4 + (r1 - 4) * ease.outCubic(u)) * k;
    ripple(p, 0, 0.5, r, r * 0.2, u < 0.3 ? W[7] : W[6], W[5], 1.4 * (1 - seg(u, 0.35, 1)), o.seed + t0 * 10);
  }
  spray(p, t, o, false);
}

export function draw(p, t, o) {
  spray(p, t, o, true);
}

function spray(p, t, o, front) {
  const W = fit(o.palette), S = o.seed, k = o.size;
  // the slap: two frames of white where the foot lands
  if (front && t < 0.07) {
    p.ellipse(-7, -1, 4, 1.5, WHITE);
    p.ellipse(7, -1, 4, 1.5, WHITE);
    p.glow(0, -2, 16, W[6], 0.35);
  }
  // the fans: sheets of water flung out low to either side, breaking into drops as they fall
  burst(22, S, (r, i) => {
    const z = r.range(-1, 1);
    if (z > 0 !== front) return;
    const side = i % 2 ? 1 : -1, vx = side * r.range(22, 62) * k, vy = -r.range(50, 110) * k;
    const x0 = side * r.range(3, 6) * k, y0 = -1, land = z * 2.2, tl = landTime(y0, vy, G, land);
    if (Math.abs(vx) * tl > 22 * k) return; // keep the far throws on the canvas
    if (t < tl) {
      const x = x0 + vx * t, y = y0 + vy * t + 0.5 * G * t * t, sheet = t < 0.12;
      const len = sheet ? 0.045 : 0.018;
      p.line(x - vx * len, y - (vy + G * t) * len, x, y, sheet ? W[6] : W[5]);
      p.px(x, y, t < 0.2 ? W[7] : W[6]);
    } else if (t < tl + 0.18) {
      const u = (t - tl) / 0.18, lx = x0 + vx * tl;
      if (u < 0.35) p.px(lx, land - 1, W[6]);
      else ripple(p, lx, land, 1 + u * 2, 0.6, W[5], W[4], 1.3 * (1 - u), i);
    }
  });
}
