import { PAL, hex, cycle, TAU, WHITE } from "../../core/index.js";
import { Layer, shadow, bob, fit } from "./_lib.js";

export const meta = {
  name: "Potion",
  desc: "A round glass flask of glowing brew floating over its shadow: the surface sloshes with the bob, bubbles rise and pop, wisps curl off the cork.",
  tags: ["pickup", "potion", "flask", "mana", "loop"],
  size: [36, 48],
  origin: [18, 44],
  duration: 1.5,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.arcane, fill: 0.6, shadow: true, seed: 8 },
};

const L = new Layer(40, 40);
const GLASS = [hex("#16141f"), hex("#2a2738"), hex("#3c3850"), hex("#8f8aa8"), hex("#d8d4ec")];
const CORK = [hex("#3d2414"), hex("#6a421e"), hex("#8e5c2c"), hex("#b47c40")];

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration, S = o.seed;
  const by = Math.round(-15 + bob(ph, 1.5)), R = 7.5;
  // the surface sloshes against the bob and ripples
  const tilt = 0.14 * Math.cos(ph * TAU), level = by + R - 2 * R * o.fill;
  const surf = (x) => level + tilt * x + 0.6 * Math.sin(x * 0.8 - ph * TAU * 2);
  const q = L.begin(-18, by - 24);
  // glass: the bulb and the neck, dark inside
  q.circle(0, by, R, GLASS[1]);
  q.rect(-3, by - 13, 6, 8, GLASS[1]);
  // the brew, shaded round: lit top left, deep at the bottom right, a bright line at the surface
  L.fill(-8, by - 8, 8, by + 8, (x, y) => {
    const dx = x, dy = y - by, d = Math.hypot(dx, dy);
    if (d > R - 0.6 || y < surf(x)) return 0;
    if (y < surf(x) + 1) return C[5];
    const lit = -(dx * 0.6 + dy * 0.8) / R;
    return d > R - 1.8 && lit < 0 ? C[2] : lit > 0.25 ? C[4] : lit > -0.45 ? C[3] : C[2];
  });
  // bubbles rise through the brew and pop at the surface
  cycle(t, meta.duration, 6, S, (r) => r.range(0.4, 0.8), (age, life, r) => {
    const x = r.range(-4.5, 4.5) + Math.sin(age * 9 + r.next() * 6) * 0.8, y = by + 6 - age * r.range(12, 18);
    if (y < surf(x) + 0.5) return;
    if (r.next() < 0.35) {
      q.px(x, y, C[6]);
      q.px(x + 1, y, C[5]), q.px(x, y + 1, C[5]), q.px(x + 1, y + 1, C[4]);
    } else q.px(x, y, C[6]);
  });
  // the rim and the cork
  q.rect(-4, by - 14, 8, 2, GLASS[3]);
  q.rect(-4, by - 14, 8, 1, GLASS[4]);
  q.rect(-2, by - 18, 4, 4, CORK[2]);
  q.rect(-2, by - 18, 1, 4, CORK[3]);
  q.rect(1, by - 18, 1, 4, CORK[1]);
  q.rect(-2, by - 18, 4, 1, CORK[3]);
  // glass highlights: a curved streak on the bulb, a line down the neck
  q.arc(0, by, R - 1.2, 1.2, Math.PI * 1.05, Math.PI * 1.42, GLASS[4]);
  q.px(-5, by - 2, WHITE);
  q.rect(-2, by - 12, 1, 4, GLASS[3]);
  L.outline(GLASS[0]);
  L.draw(p);
  // wisps curl up from the cork and fade
  cycle(t, meta.duration, 4, S + 1, 0.75, (age, life, r) => {
    const k = age / life, x = r.range(-2, 2) + Math.sin(age * 5 + r.next() * TAU) * 2.5 * k, y = by - 19 - age * r.range(8, 11);
    if (k > 0.65 && Math.floor(age * 30) % 2) return;
    p.px(x, y, k < 0.3 ? C[6] : k < 0.6 ? C[5] : C[4]);
    p.light(x, y, C[5], 0.4 * (1 - k));
  });
  const pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  p.glow(0, by + 2, 20, C[4], 0.16 * pulse);
  if (o.shadow) shadow(p, 0, 6.5 + bob(ph, 0.6));
}
