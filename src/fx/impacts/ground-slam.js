import { PAL, ramp, hex, burst, fly, seg, ease, clamp, TAU, WHITE } from "../../core/index.js";
import { puff } from "./_lib.js";

export const meta = {
  name: "Ground slam",
  desc: "A huge slam: the floor flashes and cracks, a flat shockwave races out with a wall of dust on it, rock chunks erupt, bounce and settle in the dust.",
  tags: ["impact", "ground", "slam", "shockwave", "rocks", "dust", "one-shot"],
  size: [128, 64],
  origin: [64, 50],
  duration: 1.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.stone, dust: PAL.dust, radius: 56, count: 9, seed: 12 },
};

const HOT = hex("#ffe2a0");

// a rock thrown from (x0, y0 <= 0): flies, hits the floor, hops once, then rests. Returns [x, y, phase].
function hop(x0, y0, vx, vy, t, g) {
  const T1 = (-vy + Math.sqrt(vy * vy - 2 * g * y0)) / g;
  if (t < T1) return [x0 + vx * t, y0 + vy * t + 0.5 * g * t * t, 0];
  const x1 = x0 + vx * T1, vy2 = -(vy + g * T1) * 0.3, vx2 = vx * 0.45, T2 = (-2 * vy2) / g, t2 = t - T1;
  if (t2 < T2) return [x1 + vx2 * t2, vy2 * t2 + 0.5 * g * t2 * t2, 1];
  return [x1 + vx2 * T2 + vx2 * 0.15 * (1 - Math.exp(-(t2 - T2) * 12)), 0, 2];
}

export function draw(p, t, o) {
  const C = ramp(o.palette), D = ramp(o.dust), S = o.seed, R = o.radius, N = C.length - 1, M = D.length - 1;
  const R0 = 6, front = (tt) => R0 + (R - R0) * ease.outCubic(seg(tt, 0.03, 0.55));
  const sw = seg(t, 0.03, 0.5);
  // cracks: jagged dark lines run out across the floor face, a lit lip under each, fading at the end
  const crk = ease.outCubic(seg(t, 0, 0.12)), cf = 1 - seg(t, 0.85, 1.15);
  if (crk > 0 && cf > 0)
    burst(6, S + 5, (r, i) => {
      const side = i % 2 ? 1 : -1, len = r.range(14, 30) * crk;
      let x = side * r.range(1, 3), y = 0, dir = r.range(0.2, 0.5);
      const pts = [[x, y]];
      for (let d = 0; d < len; ) {
        const step = r.range(2.5, 5);
        d += step;
        y = clamp(y + dir * step * r.range(0.2, 1.1), 0, 4);
        if (y >= 4 || r.next() < 0.3) dir = -dir * r.range(0.5, 1);
        x += side * step;
        pts.push([x, y]);
      }
      p.polyline(pts.map(([px, py]) => [px, py + 1]), C[2], cf);
      p.polyline(pts, C[0], cf);
    });
  // the dust wall: kicked up where the front passes, a tall bright crest that slumps and thins behind it
  burst(36, S + 1, (r, i) => {
    const side = i % 2 ? 1 : -1, j = i >> 1, d = R0 + 1 + ((R - R0 - 3) * (j + r.range(0, 0.9))) / 18;
    const born = 0.03 + 0.52 * (1 - Math.cbrt(1 - (d - R0) / (R - R0))), near = 1 - d / R;
    const life = r.range(0.22, 0.36) * (0.7 + near), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life;
    const [x, y] = fly(side * d, -1, side * r.range(10, 30), -r.range(30, 80) * (0.35 + near), age, 20, 4);
    const rad = (1 + (1.8 + 3.4 * near) * r.range(0.7, 1.25) * ease.outCubic(seg(q, 0, 0.35))) * (1 - 0.7 * ease.inQuad(seg(q, 0.4, 1)));
    puff(p, x, Math.min(y, -rad * 0.5), rad, D.slice(2), 1 - seg(q, 0.9, 1), 0.9 - q * 1.2, 0.7);
  });
  // the cloud left at the middle: a cluster of soft puffs that billows up together, thins and shrinks away
  burst(16, S + 2, (r, i) => {
    const born = 0.04 + i * 0.012, life = r.range(0.5, 0.85), age = t - born;
    if (age < 0 || age > life) return;
    const q = age / life, [x, y] = fly(r.range(-12, 12), -2, r.range(-30, 30), -r.range(16, 70) * (1 - Math.abs(i - 8) / 14), age, -4, 2.8);
    const rad = (1.5 + r.range(1.8, 4.6) * ease.outCubic(seg(q, 0, 0.4))) * (1 - 0.8 * ease.inQuad(seg(q, 0.4, 1)));
    puff(p, x, Math.min(y, -rad * 0.6), rad, D.slice(2), 1 - seg(q, 0.88, 1), 0.6 - q * 0.4, 0.4);
  });
  // the shockwave: a flat ring skating out along the floor (its far half shows above the floor line)
  if (sw > 0 && sw < 1) {
    const rx = front(t), ry = Math.max(2.5, rx * 0.16);
    p.shade(-rx - 1, -ry - 1, rx + 1, 0, (x, y, out) => {
      const d = Math.sqrt((x / rx) ** 2 + (y / ry) ** 2);
      if (d > 1 || d < 1 - 2 / ry) return;
      out.c = sw < 0.35 ? WHITE : D[M];
      out.a = 1.2 - sw * 1.2;
    });
    for (const sx of [-rx, rx]) p.glow(sx, -1, 7, D[M], 0.3 * (1 - sw)); // light rides the two fronts along the floor
  }
  // the floor's edge lights up from the middle out, white at the front, cooling behind it
  if (sw > 0 && sw < 1) {
    const rx = front(t);
    p.line(-rx, 0, rx, 0, (u) => (Math.abs(u * 2 - 1) > 0.82 ? WHITE : D[M]), (u) => clamp(Math.abs(u * 2 - 1) * 2.2 - 1 - sw * 0.8));
  }
  // the crests: two white crescents skating out along the floor, shrinking as they go
  if (sw > 0 && sw < 1) {
    const rx = front(t), h = 16 - 9 * sw, w = (u) => 5 * (1 - sw * 0.6) * Math.pow(u, 0.6);
    const col = (u, v) => (v > 0.55 && sw < 0.6 ? WHITE : sw < 0.3 ? D[M] : D[M - 1]);
    const al = (u, v) => clamp(1.3 - sw * 1.2 - (1 - u) * 0.6);
    p.arc(rx - h, 0, h, w, -Math.PI / 2, -0.05, (u, v) => col(u, v), al);
    p.arc(-rx + h, 0, h, (u) => w(1 - u), -Math.PI + 0.05, -Math.PI / 2, (u, v) => col(1 - u, v), (u, v) => al(1 - u, v));
  }
  // rock chunks: thrown up, tumbling, lit from above; they land, hop once, rest, then sink away
  burst(o.count, S + 3, (r, i) => {
    const born = r.range(0, 0.05), age = t - born;
    if (age < 0) return;
    const side = i % 2 ? 1 : -1, sz = r.range(1.8, 3.4), vx = side * r.range(12, 60), vy = -r.range(120, 200);
    const [x, y, ph] = hop(side * r.range(1, 8), -2, vx, vy, age, 640);
    const gone = seg(t, r.range(0.8, 0.95), 1.12);
    if (gone >= 1) return;
    const spin = r.range(-11, 11) * (ph < 2 ? age : Math.min(age, 0.9)) + r.range(0, TAU), cy = y - sz * 0.9 + gone * sz * 2;
    const shape = [0, 1, 2, 3, 4, 5].map((j) => [spin + (j * TAU) / 6 + r.range(-0.25, 0.25), r.range(0.7, 1.15)]);
    const at = (k) => shape.map(([a, rr]) => [x + Math.cos(a) * rr * sz * 1.2 * k, cy + Math.sin(a) * rr * sz * k]);
    const under = (px, py) => (py > 0.5 ? 0 : 1);
    p.poly(at(1 + 1 / sz), C[1], under);
    p.poly(at(1), (px, py) => (py < cy - sz * 0.3 ? C[N - 1] : py < cy + sz * 0.35 ? C[N - 3] : C[N - 4]), under);
  });
  // grit: single pebbles flicked up fast
  burst(12, S + 4, (r) => {
    const life = r.range(0.3, 0.5);
    if (t > life) return;
    const a = -Math.PI / 2 + r.range(-1.1, 1.1), sp = r.range(80, 160), [x, y] = fly(r.range(-6, 6), -1, Math.cos(a) * sp, Math.sin(a) * sp, t, 380, 1);
    if (y < 0) p.px(x, y, t < 0.15 ? D[M] : D[M - 2]);
  });
  // the flash: the floor itself goes white for a frame, then a hot rim
  if (t < 0.035) p.ellipse(0, -1, 18, 6, (d) => (d < 0.6 ? WHITE : HOT), (d, a) => (Math.sin(a) > 0.2 ? 0 : 1));
  else if (t < 0.07) p.ellipse(0, -1, 14, 4, HOT, (d, a) => (d > 0.65 && Math.sin(a) <= 0.2 ? 1 : 0));
  const L = 1 - seg(t, 0, 0.35);
  p.glow(0, -6, 48, HOT, 0.45 * L * L);
  p.glow(0, -2, 14, WHITE, 0.4 * L * L * L);
}
