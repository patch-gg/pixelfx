import { cycle, fract, TAU } from "../../core/index.js";
import { Grid, shades, lit, shift } from "./_lib.js";

export const meta = {
  name: "Ghost",
  desc: "A little sheet ghost bobs in the air, its scalloped hem rippling, nub arms waving, an O mouth and a slow blink; a cold glow around it.",
  tags: ["critter", "ghost", "spooky", "undead", "float", "loop"],
  size: [36, 44],
  origin: [18, 22],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#1e1838", "#5a5490", "#a6a8d8", "#dfe4fa", "#ffffff"], seed: 1 },
};

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), ph = t / meta.duration;
  const bob = Math.sin(ph * TAU) * 2.5, lean = Math.cos(ph * TAU) * 0.08;
  const hy = -7 + bob, R = 8.5, base = 7 + bob;
  const g = new Grid(-18, -22, 36, 44);
  // the sheet: a dome over a body that flares a touch, the hem in rounded lobes that roll sideways
  g.shade(-12, hy - R - 1, 12, base + 4, (x, y) => {
    const xs = x - (y - hy) * lean;
    let nx, ny;
    if (y < hy) {
      nx = xs / R;
      ny = (y - hy) / R;
      if (nx * nx + ny * ny > 1) return 0;
    } else {
      const w = R + (y - hy) * 0.14;
      nx = xs / w;
      ny = 0;
      if (Math.abs(nx) > 1) return 0;
      const lobe = fract((xs + 10) / 6.4 + ph * 2), hem = base + 3 * Math.sqrt(Math.max(0, 1 - (2 * lobe - 1) ** 2));
      if (y > hem) return 0;
      if (y > hem - 1.5) return S[2];
    }
    const L = lit(nx, ny * 0.8 - 0.1);
    if (L > 0.86 && y < hy - 2) return S[4];
    if (L > 0.45) return S[3];
    if (L > 0.2) return S[2];
    return S[1];
  });
  // nub arms, waving out of step
  for (const side of [-1, 1]) {
    const wave = Math.sin(ph * TAU * 2 + (side > 0 ? 1.4 : 0));
    g.ellipse(side * (R + 1.2), hy + 7 + wave * (side > 0 ? 1.5 : 0.8), 2.4, 1.6, (nx, ny) => (ny < 0 && side < 0 ? S[3] : S[2]));
  }
  // face: tall eyes, an O mouth, a blink once a loop
  const blink = ph > 0.62 && ph < 0.67;
  for (const ex of [-3, 2]) {
    const x = Math.round(ex + 0.4 * lean * 10), y = Math.round(hy - 1);
    if (blink) g.set(x, y + 1, S[0]), g.set(x + 1, y + 1, S[0]);
    else for (let k = -1; k <= 1; k++) g.set(x, y + k, S[0]), g.set(x + 1, y + k, S[0]);
  }
  const my = Math.round(hy + 4);
  g.set(-1, my, S[0]), g.set(0, my, S[0]), g.set(-1, my + 1, S[1]), g.set(0, my + 1, S[0]);
  g.outline(S[0]);
  // a few cold motes trickle off the hem and fade (drawn first, so the sheet hides them)
  cycle(t, meta.duration, 6, o.seed, 1.2, (age, life, r) => {
    const k = age / life, x = r.range(-8, 8) + Math.sin(age * 3 + r.next() * 6) * 1.5, y = base + 1 + age * r.range(5, 9);
    p.dot(x, y, k < 0.4 ? S[4] : S[2], 1 - k);
  });
  g.draw(p);
  p.glow(0, hy + 4, 22, S[2], 0.16);
}
