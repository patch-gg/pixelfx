import { PAL, burst, stream, seg, ease, bump, clamp, rng, lerp, TAU, WHITE } from "../../core/index.js";
import { fit, ovalLine, sparkle, feather } from "./_lib.js";

export const meta = {
  name: "Resurrection",
  desc: "A revive: light falls on the fallen, wings of light unfold behind them, a glow climbs the body, the wings beat once and scatter into feathers.",
  tags: ["holy", "revive", "resurrect", "wings", "light", "character", "one-shot"],
  size: [84, 68],
  origin: [42, 60],
  duration: 2.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.holy, seed: 34 },
};

const SHOULDER = [2, -13];
// the right wing at rest, fully open: an arm rising up and out from the shoulder, feathers hanging from it,
// short ones near the body pointing down, long primaries at the tip sweeping out. Points are relative to the shoulder.
const ARM = [[0, 0], [6, -7], [12, -13]];
const QUILLS = Array.from({ length: 7 }, (_, k) => {
  const u = k / 6, seg2 = u * 2, i = Math.min(1, Math.floor(seg2)), f = seg2 - i;
  const bx = ARM[i][0] + (ARM[i + 1][0] - ARM[i][0]) * f, by = ARM[i][1] + (ARM[i + 1][1] - ARM[i][1]) * f;
  return { bx, by, ang: lerp(1.7, -0.35, Math.pow(u, 1.2)), len: lerp(9, 16, u) };
});

// the wing's pose: folded down the back, unfolding with an overshoot, one deep beat, then coming apart
function pose(t) {
  const open = ease.outBack(seg(t, 0.3, 0.75), 1.5), beat = bump(t, 1.15, 1.45);
  return { rot: (1 - open) * 1.6 + beat * 0.55, scale: 0.45 + 0.55 * Math.min(1, open) };
}
const dissolve = (t) => seg(t, 1.42, 1.72);

// a point of the right wing (relative to the shoulder), turned and scaled by the pose, mirrored for the left
function place(x, y, P, side) {
  const c = Math.cos(P.rot), s = Math.sin(P.rot), X = (x * c - y * s) * P.scale, Y = (x * s + y * c) * P.scale;
  return [SHOULDER[0] * side + X * side, SHOULDER[1] + Y];
}

function wings(p, t, o) {
  const C = fit(o.palette), P = pose(t), dis = dissolve(t);
  if (t < 0.3 || dis >= 1) return;
  for (const side of [-1, 1]) {
    // feathers from the body outward, so the long primaries lie on top
    QUILLS.forEach((q, j) => {
      const r = rng(o.seed, j, side > 0 ? 1 : 2), keep = 1 - seg(dis, r.range(0, 0.4), r.range(0.45, 1));
      if (keep <= 0) return;
      const a = q.ang + P.rot, L = q.len * P.scale * keep, dx = Math.cos(a) * side, dy = Math.sin(a), nx = -dy, ny = dx;
      const [bx, by] = place(q.bx, q.by, P, side), tx = bx + dx * L, ty = by + dy * L, w = 1.9 * P.scale + 0.6;
      p.poly([[bx + nx * w, by + ny * w], [tx + nx * w * 0.7, ty + ny * w * 0.7], [tx + dx * 1.6, ty + dy * 1.6], [tx - nx * w * 0.7, ty - ny * w * 0.7], [bx - nx * w, by - ny * w]],
        (x, y) => {
          const v = ((x - bx) * nx + (y - by) * ny) / w; // -1 .. 1 across the feather
          return v * side < -0.45 ? C[4] : v * side > 0.5 ? C[6] : C[5];
        });
    });
    // the arm: a bright bone of light along the top edge
    const pts = ARM.map(([x, y]) => place(x, y, P, side));
    p.polyline(pts, WHITE);
    p.polyline(pts.map(([x, y]) => [x, y + 1]), C[6]);
  }
  p.glow(0, -18, 30, C[5], 0.3 * P.scale * (1 - dis));
}

export function drawBack(p, t, o) {
  const C = fit(o.palette);
  // light falling from above: a soft column that brightens as the wings open
  const col = bump(t, 0, 1.9);
  p.glowLine(0, -56, 0, 0, 12, C[4], 0.28 * col);
  wings(p, t, o);
}

export function draw(p, t, o) {
  const C = fit(o.palette), A = o.actor, S = o.seed;
  // a ring of light on the floor
  const g = seg(t, 0.05, 0.6), gOut = seg(t, 1.5, 1.9);
  if (g > 0 && gOut < 1) {
    const R = 6 + 10 * ease.outCubic(g);
    ovalLine(p, R, R * 0.3, g < 0.3 ? WHITE : C[5], 1 - gOut);
  }
  // the revive glow: a bright band climbs the body, then the outline pulses twice
  const climb = seg(t, 0.45, 1.0);
  if (climb > 0 && climb < 1) {
    const band = -A.h * ease.inOutSine(climb);
    p.mask(A.mask, A.x, A.y, (mx, my) => {
      const d = Math.abs(A.y + my - band);
      return d < 1 ? WHITE : C[6];
    }, (mx, my) => (Math.abs(A.y + my - band) < 2.5 ? 1 : 0));
  }
  const pulse = Math.max(bump(t, 0.95, 1.15), bump(t, 1.2, 1.4), seg(t, 0.4, 0.5) * (1 - seg(t, 1.5, 1.8)) * 0.5);
  if (pulse > 0.05) p.outline(A.mask, A.x, A.y, pulse > 0.6 ? WHITE : C[5], Math.min(1, pulse * 1.6));
  // motes rising from the floor all the way up
  stream(t, 0.1, 1.3, 22, S, (r) => r.range(0.55, 0.85), (age, life, r) => {
    const k = age / life, x = r.range(-12, 12) + Math.sin(age * 5 + r.next() * TAU), y = -age * r.range(30, 48);
    sparkle(p, x, y, k > 0.2 && k < 0.45 ? 1 : 0, C[6], C[5], k < 0.5 ? WHITE : C[6]);
  });
  // a halo flickers on above the head at the peak
  const h = seg(t, 0.9, 1.05) * (1 - seg(t, 1.5, 1.75));
  if (h > 0) ovalLine(p, 5, 1.6, (ang) => (Math.sin(ang) > 0 ? WHITE : C[5]), h, 0, A.head[1] - 4);
  // the wings scatter: feathers fall away from where they were, rocking as they drift
  if (dissolve(t) > 0)
    burst(14, S + 3, (r, i) => {
      const side = i % 2 ? 1 : -1, q = QUILLS[(i >> 1) % 7], P = pose(1.42), along = r.range(0.4, 1) * q.len;
      const born = 1.42 + r.range(0, 0.25), age = t - born, life = r.range(0.45, 0.6);
      if (age < 0 || age > life) return;
      const [bx, by] = place(q.bx, q.by, P, side), a = q.ang + P.rot;
      const x0 = bx + Math.cos(a) * side * along * P.scale, y0 = by + Math.sin(a) * along * P.scale;
      const sway = Math.sin(age * 8 + i), x = x0 + side * age * r.range(6, 14) + sway * 2.5, y = y0 + age * r.range(16, 26);
      if (y > -1) return; // landed
      feather(p, x, y, sway * 0.8 + (side > 0 ? 0 : Math.PI), [C[2], C[3], C[5], C[6], WHITE], 1 - seg(age, life * 0.75, life));
    });
  p.glow(0, -10, 20, C[5], 0.3 * clamp(climb * 2) * (1 - seg(t, 1.3, 1.9)));
}
