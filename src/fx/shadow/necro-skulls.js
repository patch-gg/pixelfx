import { cycle, rng, TAU } from "../../core/index.js";
import { steps, SPECTRAL, SKULL_7, shape } from "./_lib.js";

export const meta = {
  name: "Necro skulls",
  desc: "Ghostly green skulls circle a point on a tilted orbit, trailing smoke, jaws chattering, dimming as they swing behind.",
  tags: ["shadow", "necromancy", "skull", "ghost", "undead", "orbit", "loop"],
  size: [60, 46],
  origin: [30, 26],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: SPECTRAL, count: 5, radius: 18, seed: 7 },
};

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, D = meta.duration, ph = t / D, n = o.count, RX = o.radius, RY = RX * 0.32;

  // where skull i is at loop phase q: one turn a loop, its own wobble in radius and height
  const where = (i, q) => {
    const r = rng(S, i), th = q * TAU + (i * TAU) / n + r.range(-0.25, 0.25);
    const rad = 1 + 0.12 * Math.sin(q * TAU * 2 + r.range(0, TAU));
    const bob = Math.sin(q * TAU * 3 + r.range(0, TAU)) * 1.6;
    return [Math.cos(th) * RX * rad, Math.sin(th) * RY * rad + bob, Math.sin(th)];
  };

  const skulls = [];
  for (let i = 0; i < n; i++) skulls.push({ i, pos: where(i, ph) });
  skulls.sort((a, b) => a.pos[2] - b.pos[2]); // far first

  const core = () => {
    // a cold flame at the center the skulls are bound to
    const fl = 0.8 + 0.2 * Math.sin(ph * TAU * 6);
    p.ellipse(0, -1, 2.2 * fl, 3.4 * fl, (d) => (d < 0.45 ? C[7] : d < 0.8 ? C[6] : C[5]));
    p.glow(0, -1, 26, C[5], 0.22 * fl);
    p.glow(0, -1, 8, C[6], 0.35 * fl);
  };

  let coreDone = false;
  for (const { i, pos } of skulls) {
    const [x, y, depth] = pos, far = depth < 0;
    if (!far && !coreDone) (core(), (coreDone = true));
    // smoke tail: the path it just came along, thinning and darkening
    for (let j = 6; j >= 1; j--) {
      const [tx, ty] = where(i, ph - j * 0.018);
      const rr = 2.8 - j * 0.38, c = j > 4 ? C[2] : j > 2 ? C[3] : C[4];
      p.circle(tx, ty + 0.5, rr, far ? C[Math.max(1, (j > 4 ? 2 : j > 2 ? 3 : 4) - 1)] : c);
    }
    // the skull: pale bone, darker when it swings behind, jaw chattering
    const chat = Math.sin(ph * TAU * 8 + i * 2.1) > 0.3 ? 1 : 0;
    const top = far ? C[5] : C[7], body = far ? C[4] : C[6], dark = far ? C[2] : C[4];
    const sx = Math.round(x) - 3, sy = Math.round(y) - 4;
    shape(p, SKULL_7, sx, sy, (ch, mx, my) => {
      if (ch === "e") return C[0];
      if (ch === "n" || ch === "t") return dark;
      if (my >= 5) return null;
      return my === 0 || (my === 1 && mx < 4) ? top : body;
    });
    // jaw: drops a pixel when it chatters
    shape(p, SKULL_7.slice(5), sx, sy + 5 + chat, (ch) => (ch === "t" ? C[0] : ch === "#" ? (far ? C[4] : C[5]) : 0));
    // eyes burn
    if (!far || depth > -0.5) {
      p.px(sx + 1, sy + 3, C[7]), p.px(sx + 4, sy + 3, C[7]);
      p.light(x, y - 1, C[6], far ? 0.15 : 0.3);
    }
  }
  if (!coreDone) core();

  // motes rising off the circle
  cycle(t, D, 10, S + 3, (r) => r.range(0.7, 1.2), (age, life, r) => {
    const k = age / life, a = r.range(0, TAU), x = Math.cos(a) * RX * r.range(0.4, 1.1);
    const y = Math.sin(a) * RY - age * r.range(10, 17) + Math.sin(age * 7 + r.next() * 6);
    p.px(x, y, k < 0.5 ? C[6] : C[4]);
  });
}
