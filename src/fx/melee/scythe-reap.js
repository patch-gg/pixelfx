import { ramp, at, burst, seg, ease, clamp, smooth, WHITE } from "../../core/index.js";

export const meta = {
  name: "Scythe reap",
  desc: "A slow, huge reap: a dark crescent with a pale ghostly edge hangs in the air a beat, then tears away and leaves its ghost to rise, waver and fade.",
  tags: ["melee", "slash", "scythe", "reaper", "dark", "ghost", "shadow", "combat", "directional", "one-shot"],
  size: [72, 68],
  origin: [22, 56],
  duration: 0.9,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#05030a", "#120a1e", "#24123a", "#3a1e5a", "#5a3a80", "#8a7ab0", "#bfe8d8", "#effff8"], radius: 30, seed: 13 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), R = o.radius, S = o.seed, top = C.length - 1;
  const cx = -2, cy = -10, A0 = -1.75, A1 = Math.asin(clamp((-1 - cy) / R)); // from overhead round to the floor in front
  const lead = ease.outCubic(seg(t + 0.02, 0, 0.17)), tail = ease.inQuad(seg(t, 0.14, 0.5));
  const la = A0 + (A1 - A0) * lead, ta = A0 + (A1 - A0) * tail, W = 11, tear = seg(t, 0.18, 0.55);
  if (la - ta > 0.02) {
    // the crescent: dark body, a pale edge on the outside, thickest a little behind the blade; as it tears away
    // the body goes first and the ghostly edge lingers
    p.arc(cx, cy, R, (u) => W * Math.pow(u, 0.5) * (u > 0.9 ? (1 - u) / 0.1 : 1) + 1, ta, la,
      (u, v) => (v > 0.86 ? (u > 0.5 ? C[top] : C[top - 1]) : v > 0.72 ? C[top - 2] : at(C.slice(1, top - 2), v * 0.85 + u * 0.3)),
      (u, v) => clamp(smooth(0, 0.3, u) * 1.5) * clamp(1.4 - (1 - u * 0.7) * tear * (v > 0.72 ? 1.6 : 3)));
    const ex = cx + Math.cos(la) * (R - 3), ey = cy + Math.sin(la) * (R - 3);
    p.glow(ex, ey, 16, C[top - 2], 0.3 * (1 - seg(t, 0.15, 0.5)));
    p.glow(cx + Math.cos((la + ta) / 2) * R * 0.85, cy + Math.sin((la + ta) / 2) * R * 0.85, 26, C[top - 3], 0.22 * (1 - seg(t, 0.2, 0.55)));
  }
  // its ghost: where the crescent tore away, a pale copy of it lingers, rising and wavering, thinning from below
  const g = seg(t, 0.2, 0.32) * (1 - seg(t, 0.5, 0.86));
  if (g > 0) {
    const rise = 14 * ease.outQuad(seg(t, 0.2, 0.86)), wob = 0.6 + 2.2 * seg(t, 0.2, 0.86), ph = t * 14;
    const span = A1 - A0, x0 = cx - R - 4, x1 = cx + R + 4, y0 = cy - R - rise - 2, y1 = cy + R * Math.sin(A1) + 2 - rise;
    p.shade(x0, y0, x1, y1, (x, y, out) => {
      const sy = y + rise, sx = x - Math.sin(sy * 0.45 + ph) * wob, dx = sx - cx, dy = sy - cy, d = Math.sqrt(dx * dx + dy * dy);
      if (d > R || d < R - 7) return;
      let a = Math.atan2(dy, dx) - A0;
      a -= Math.floor(a / 6.283185) * 6.283185;
      const u = a / span;
      if (u > 1) return;
      const w = 7 * Math.pow(u, 0.5) * (u > 0.9 ? (1 - u) / 0.1 : 1) + 1, v = (d - (R - w)) / w;
      if (v < 0) return;
      out.c = v > 0.8 ? C[top - 1] : C[top - 2];
      out.a = g * (v > 0.8 ? 0.95 : 0.4) * clamp(1.6 - (sy - (cy - R)) / (R * 1.4) * (1 - g) * 2.4);
      out.k = 0.12 * g;
    });
  }
  // a few souls slip out of it and float up
  burst(6, S, (r, i) => {
    const u = (i + r.range(0.2, 0.8)) / 6, ang = A0 + (A1 - A0) * u;
    const born = 0.2 + 0.25 * Math.sqrt(u) + r.range(0, 0.05), age = t - born, life = r.range(0.28, 0.38);
    if (age < 0 || age > life) return;
    const k = age / life, x = cx + Math.cos(ang) * (R - 2) + Math.sin(age * 10 + i) * 2, y = cy + Math.sin(ang) * (R - 2) - age * r.range(30, 46);
    p.dot(x, y, k < 0.5 ? C[top] : C[top - 1], clamp((1 - k) * 2.2));
    p.dot(x, y + 1, C[top - 1], clamp((1 - k) * 1.6));
    p.dot(x, y + 2, C[top - 2], clamp((1 - k) * 1.2));
    p.light(x, y, C[top - 1], 0.3 * (1 - k));
  });
}
