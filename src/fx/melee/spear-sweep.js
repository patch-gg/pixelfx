import { PAL, ramp, at, burst, fly, seg, ease, clamp, smooth, wrap, TAU, WHITE } from "../../core/index.js";
import { dustCloud } from "./_lib.js";

export const meta = {
  name: "Spear sweep",
  desc: "A long polearm swept low around the front: a wide flat arc skims the floor from behind to the far side, kicking up a wake of dust.",
  tags: ["melee", "sweep", "spear", "polearm", "low", "ground", "combat", "directional", "one-shot"],
  size: [92, 40],
  origin: [44, 32],
  duration: 0.7,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.cyber, radius: 34, seed: 10 },
};

const DUST = ramp(["#2e2830", "#463e48", "#655b63", "#8a7f84", "#b0a5a6", "#d6cdc8"]);
const P0 = Math.PI + 0.45, P1 = -0.4; // from behind on the left, round the front, to behind on the right
const CY = -7;

const leadAt = (t) => P0 + (P1 - P0) * ease.outCubic(seg(t + 0.02, 0, 0.22));
const tailAt = (t) => P0 + (P1 - P0) * ease.inQuad(seg(t, 0.05, 0.34));

function band(p, t, o, front) {
  const C = ramp(o.palette), R = o.radius, ry = R * 0.24, top = C.length - 1;
  const lead = leadAt(t), tail = tailAt(t), span = tail - lead, fade = seg(t, 0.2, 0.34);
  if (span <= 0.03 || fade >= 1) return;
  p.shade(-R - 1, CY - ry - 1, R + 1, CY + ry + 1, (x, y, out) => {
    const nx = x / R, ny = (y - CY) / ry, d = Math.sqrt(nx * nx + ny * ny);
    if (d > 1) return;
    const ang = Math.atan2(ny, nx);
    if (Math.sin(ang) >= 0 !== front) return;
    const s = 1 - wrap(tail - ang, TAU) / span; // 0 at the tail .. 1 at the spear
    if (s < 0) return;
    const wdt = 0.55 * Math.pow(s, 0.7) * (s > 0.97 ? (1 - s) / 0.03 : 1) + 0.08;
    if (d < 1 - wdt) return;
    const v = (d - (1 - wdt)) / wdt;
    out.c = v > 0.74 ? (front ? WHITE : C[top - 1]) : at(C.slice(1, top), v * 0.7 + s * 0.3 + (front ? 0.1 : -0.15));
    out.a = clamp(smooth(0, 0.5, s) * (v > 0.74 ? 1.4 : 0.5 + v)) * (1 - fade * (1 - v * 0.5));
  });
  // the shaft itself at the edge: a bright line from the hands out to the tip
  if (t < 0.24 && Math.sin(lead) >= 0 === front) {
    const ex = Math.cos(lead), ey = Math.sin(lead);
    p.line(ex * 9, CY + ey * ry * 0.3, ex * R, CY + ey * ry, (u) => (u > 0.8 ? WHITE : C[top - 1]));
    p.glow(ex * (R - 3), CY + ey * (ry - 1), 12, C[top - 3], 0.4 * (1 - seg(t, 0.15, 0.24)));
  }
}

export function drawBack(p, t, o) {
  band(p, t, o, false);
}

export function draw(p, t, o) {
  const C = ramp(o.palette), R = o.radius, ry = R * 0.24, S = o.seed, top = C.length - 1;
  // a wake of dust where the tip skims the floor across the front: low, flat, overlapping puffs that roll on
  const puffs = [];
  burst(20, S, (r, i) => {
    const ang = P0 + (P1 - P0) * (0.32 + 0.56 * (i + r.range(0, 1)) / 20); // along the front of the sweep
    const born = bornAt(ang) + r.range(0, 0.02), age = t - born, life = r.range(0.3, 0.42);
    if (age < 0 || age > life || Math.sin(ang) < 0.2) return;
    const k = age / life, push = ease.outCubic(seg(age, 0, 0.35));
    puffs.push({
      x: Math.cos(ang) * R * r.range(0.82, 0.98) + push * r.range(3, 9), y: -1 - push * r.range(1, 3.5) - age * 4,
      r: r.range(3, 4.6) * (0.45 + 0.7 * push) * (1 - 0.85 * ease.inQuad(seg(k, 0.4, 1))), a: 1 - seg(k, 0.85, 1), sy: 0.6,
    });
  });
  dustCloud(p, puffs, DUST, S, 0.22, 0.4);
  band(p, t, o, true); // the blade over its own dust
  // grit flicked up ahead of the blade
  burst(8, S + 1, (r) => {
    const ang = P0 + (P1 - P0) * r.range(0.3, 0.85), born = bornAt(ang), age = t - born, life = r.range(0.25, 0.4);
    if (age < 0 || age > life || Math.sin(ang) < 0.1) return;
    const x0 = Math.cos(ang) * R * 0.95, y0 = CY + Math.sin(ang) * ry, vx = Math.sin(ang) * r.range(40, 80);
    const [x, y] = fly(x0, Math.min(y0, -1), vx, -r.range(40, 80), age, 320, 1);
    if (y > 0) return;
    p.px(x, y, at(DUST, r.range(0.5, 1)));
  });
  // glints off the spearhead as it whips past the front
  burst(5, S + 2, (r) => {
    const ang = P0 + (P1 - P0) * r.range(0.35, 0.8), born = bornAt(ang), age = t - born, life = r.range(0.12, 0.2);
    if (age < 0 || age > life) return;
    const x0 = Math.cos(ang) * R, y0 = CY + Math.sin(ang) * ry;
    const [x, y] = fly(x0, y0, Math.sin(ang) * r.range(50, 90), -r.range(10, 40), age, 100, 4), k = age / life;
    p.px(x, y, k < 0.5 ? WHITE : C[top - 1]);
    p.light(x, y, C[top - 3], 0.4 * (1 - k));
  });
}

// when the spear's edge passes an angle on its way round
function bornAt(ang) {
  let lo = 0, hi = 0.22;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (leadAt(mid) > ang) lo = mid;
    else hi = mid;
  }
  return lo;
}
