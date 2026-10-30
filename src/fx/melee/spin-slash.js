import { ramp, at, burst, fly, seg, ease, clamp, smooth, wrap, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Spin slash",
  desc: "A full-circle spin attack: the blade sweeps a ring around the fighter's waist, front then back, and the ring flares out and dissolves.",
  tags: ["melee", "slash", "spin", "sword", "aoe", "combat", "one-shot"],
  size: [76, 48],
  origin: [38, 38],
  duration: 0.45,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#04201c", "#0a3a30", "#12604a", "#1f8a62", "#3cb87a", "#7ee0a0", "#c8ffd8", "#ffffff"], radius: 26, seed: 4 },
};

// the swept band of the spin, front (sin > 0, in front of the body) or back half
function band(p, t, o, front) {
  const C = ramp(o.palette), R = o.radius, ry = R * 0.3, cy = -11, top = C.length - 1;
  // the edge goes once round, left > front > right > back > left: angle runs from PI down to -PI
  const lead = Math.PI - 0.25 - TAU * ease.outSine(seg(t + 0.03, 0, 0.25));
  const tail = Math.PI - 0.25 - TAU * ease.inQuad(seg(t, 0, 0.3));
  const span = tail - lead, fade = seg(t, 0.2, 0.32);
  if (span > 0.03 && fade < 1) {
    p.shade(-R - 1, cy - ry - 1, R + 1, cy + ry + 1, (x, y, out) => {
      const nx = x / R, ny = (y - cy) / ry, d = Math.sqrt(nx * nx + ny * ny);
      if (d > 1) return;
      const ang = Math.atan2(ny, nx);
      if (Math.sin(ang) >= 0 !== front) return;
      const s = 1 - wrap(tail - ang, TAU) / span; // 0 at the tail .. 1 at the edge
      if (s < 0) return;
      const wdt = 0.55 * Math.pow(s, 0.6) * (s > 0.96 ? (1 - s) / 0.04 : 1) + 0.1;
      if (d < 1 - wdt) return;
      const v = (d - (1 - wdt)) / wdt; // 0 inner .. 1 rim
      const near = front ? 0.12 : -0.18; // the far side sits deeper in the ramp
      out.c = v > 0.78 ? (front ? WHITE : C[top - 1]) : at(C.slice(1, top), v * 0.75 + s * 0.25 + near);
      out.a = clamp(smooth(0, 0.4, s) * (v > 0.78 ? 1.4 : 0.55 + v)) * (1 - fade * (1 - v * 0.5));
    });
    // light rides the edge
    const lx = Math.cos(lead) * (R - 2), ly = cy + Math.sin(lead) * (ry - 1);
    if (Math.sin(lead) >= 0 === front) p.glow(lx, ly, 10, C[top - 3], (front ? 0.4 : 0.2) * (1 - fade));
  }
  // the closed ring flares outward and dissolves once the spin is done
  const ring = seg(t, 0.22, 0.38);
  if (ring > 0 && ring < 1) {
    const e = ease.outCubic(ring), rr = R + 6 * e, rry = ry + 2 * e;
    p.shade(-rr - 1, cy - rry - 1, rr + 1, cy + rry + 1, (x, y, out) => {
      const nx = x / rr, ny = (y - cy) / rry, d = Math.sqrt(nx * nx + ny * ny);
      if (d > 1 || d < 1 - 1.2 / rry) return;
      if ((y - cy >= 0) !== front) return;
      out.c = ring < 0.3 ? (front ? WHITE : C[top - 1]) : front ? C[top - 1] : C[top - 3];
      out.a = 1 - ring;
    });
  }
}

export function drawBack(p, t, o) {
  band(p, t, o, false);
}

export function draw(p, t, o) {
  const C = ramp(o.palette), R = o.radius, S = o.seed, top = C.length - 1;
  band(p, t, o, true);
  // glints flung off the edge, tangent to the spin
  burst(9, S, (r) => {
    const born = r.range(0.02, 0.2), age = t - born, life = r.range(0.14, 0.22);
    if (age < 0 || age > life) return;
    const ang = Math.PI - 0.25 - TAU * ease.outSine(seg(born + 0.03, 0, 0.25)), ry = R * 0.3;
    const x0 = Math.cos(ang) * R, y0 = -11 + Math.sin(ang) * ry, sp = r.range(40, 80);
    const [x, y] = fly(x0, y0, Math.sin(ang) * sp + Math.cos(ang) * 20, -r.range(20, 50), age, 150, 3), q = age / life;
    p.px(x, y, q < 0.4 ? WHITE : C[top - 2]);
    if (q < 0.3) p.px(x + 1, y, C[top - 1]), p.px(x - 1, y, C[top - 1]);
    p.light(x, y, C[top - 3], 0.4 * (1 - q));
  });
}
