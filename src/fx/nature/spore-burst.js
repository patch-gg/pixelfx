import { ramp, at, burst, fly, seg, ease, clamp, lerp, TAU, hex } from "../../core/index.js";

export const meta = {
  name: "Spore burst",
  desc: "A toadstool pushes up out of the floor, squats, and puffs a cloud of glowing spores that billow up and drift down as it shrivels back into the ground.",
  tags: ["nature", "mushroom", "fungus", "spores", "poison", "ground", "one-shot"],
  size: [64, 60],
  origin: [32, 52],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1e0c26", "#3a1450", "#5e1f74", "#8c2f92", "#bc4aa6", "#e47cc0", "#ffbade", "#fff2f8"], seed: 31 },
};

const STEM = ["#4a3c3a", "#8a7a6c", "#cbbca4", "#f0e6d0"].map(hex);
const T_PUFF = 0.42;

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed;
  // the toadstool: grows, squats (anticipation), springs up as it puffs, then shrivels into the floor
  const grow = ease.outBack(seg(t, 0, 0.22), 1.6), squat = ease.inOutQuad(seg(t, 0.26, T_PUFF)), spring = seg(t, T_PUFF, T_PUFF + 0.16);
  const shrivel = ease.inQuad(seg(t, 1.05, 1.45));
  const sq = squat * (1 - spring) + (spring > 0 ? Math.sin(spring * Math.PI * 2.5) * (1 - spring) * -0.5 : 0);
  const sy = grow * (1 - 0.3 * sq) * (1 - shrivel), sx = 1 + 0.35 * sq + 0.1 * shrivel;
  if (sy > 0.05) {
    const stemH = 9 * sy, capY = -stemH - 1, cw = 9 * sx * Math.min(1, grow + 0.2), ch = 6 * sy;
    // stem: pale, shaded right, a frill under the cap
    p.shade(-2.5 * sx, capY, 2.5 * sx, 0, (x) => (x < -1.2 * sx ? STEM[3] : x < 0.6 * sx ? STEM[2] : STEM[1]));
    if (stemH > 4) p.line(-3 * sx, capY + 2, 3 * sx, capY + 2, STEM[1]);
    // cap: a dome lit from the top left, dark rim underneath, pale spots
    p.shade(-cw - 1, capY - ch - 1, cw + 1, capY + 1.5, (x, y) => {
      const dx = x / cw, dy = (y - capY) / ch;
      if (dy > 0.25) return dx * dx < 1 - (dy - 0.25) * 2 && Math.abs(dx) < 0.95 ? C[1] : undefined;
      if (dx * dx + dy * dy > 1) return;
      const lit = -dx * 0.6 - dy;
      return lit > 0.75 ? C[6] : lit > 0.25 ? C[5] : lit > -0.25 ? C[4] : C[3];
    });
    if (cw > 4) {
      p.px(-cw * 0.45, capY - ch * 0.55, STEM[3]), p.px(-cw * 0.45 + 1, capY - ch * 0.55, STEM[3]);
      p.px(cw * 0.25, capY - ch * 0.75, STEM[3]);
      p.px(cw * 0.6, capY - ch * 0.3, STEM[2]);
    }
  }
  const a = t - T_PUFF;
  if (a < 0) return;
  const top = -9 * (1 - 0.3) - 8;
  // the puff: a white burst off the cap for two frames
  if (a < 0.07) {
    p.ellipse(0, top - 2, 9, 5, (d) => (d < 0.5 ? C[7] : C[6]));
    p.glow(0, top, 30, C[5], 0.5);
  }
  // the cloud: clumps of spore dust that billow up and out as one lumpy mass, then shrink away darkening
  const puffs = [];
  burst(11, S, (r) => {
    const life = r.range(0.7, 1), q = a / life;
    if (q >= 1) return;
    const ang = -Math.PI / 2 + r.range(-1.1, 1.1), sp = r.range(10, 26), e = ease.outCubic(Math.min(1, q * 1.6));
    const x = Math.cos(ang) * sp * e, y = top - 2 + Math.sin(ang) * sp * 0.8 * e - q * 6;
    const rad = r.range(3.5, 6) * (0.6 + 0.6 * e) * (1 - ease.inQuad(q) * 0.95);
    if (rad > 0.7) puffs.push({ x, y, r: rad, q });
  });
  if (puffs.length) {
    p.shade(-30, -56, 30, -4, (x, y) => {
      let best = 0, lit = 0, q = 0;
      for (const f of puffs) {
        const dx = x - f.x, dy = y - f.y, v = 1 - (dx * dx + dy * dy) / (f.r * f.r);
        if (v > best) (best = v), (lit = (-dx * 0.6 - dy) / f.r), (q = f.q);
      }
      if (best <= 0) return;
      // fresh dust is bright; it dulls as it ages
      return at(C.slice(2, 8), 0.3 + lit * 0.32 + best * 0.2 - q * 0.45);
    });
  }
  // spores: glowing specks shot up and out, then drifting down, swaying, twinkling out
  burst(26, S + 1, (r) => {
    const life = r.range(0.9, 1.3), age = a - r.range(0, 0.08);
    if (age < 0 || age > life) return;
    const k = age / life, ang = -Math.PI / 2 + r.range(-1.25, 1.25), sp = r.range(30, 72);
    let [x, y] = fly(0, top - 1, Math.cos(ang) * sp, Math.sin(ang) * sp, age, 22, 3.2);
    x += Math.sin(age * r.range(5, 8) + r.next() * TAU) * 2 * k;
    if (k > 0.6 && Math.sin(age * 40 + r.next() * 9) < -0.4) return;
    p.px(x, y, k < 0.4 ? C[7] : k < 0.75 ? C[6] : C[5]);
    p.light(x, y, C[5], 0.5 * (1 - k));
  });
  const L = 1 - seg(a, 0, 0.6);
  p.glow(0, top - 6, 28, C[4], 0.3 * L * L);
}
