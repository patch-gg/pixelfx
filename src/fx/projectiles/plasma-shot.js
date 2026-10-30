import { ramp, at, cycle, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Plasma shot",
  desc: "A churning teardrop of green plasma, white-hot in the head, its tail tearing into gooey droplets that shrink and boil away behind it.",
  tags: ["projectile", "plasma", "energy", "sci-fi", "directional", "loop"],
  size: [52, 23],
  origin: [42, 11],
  duration: 0.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#04161a", "#073536", "#0b5e4e", "#119060", "#2ac46e", "#7cf07c", "#d4ffc0", "#ffffff"], size: 5, seed: 3 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), R = o.size, S = o.seed, D = meta.duration, ph = t / D;
  const hx = -R + 0.5, hy = 0.5, head = [], tail = [];
  // the head: three lobes rolling around the center at different speeds make the surface churn
  for (let i = 0; i < 3; i++) {
    const a = ph * TAU * (i === 1 ? -2 : i + 1) + (i * TAU) / 3, off = R * 0.38;
    head.push([hx + Math.cos(a) * off, hy + Math.sin(a) * off * 0.85, R * 0.7]);
  }
  // the tail: two blobs that wag behind the head, then droplets torn off its end
  const wag = Math.sin(ph * TAU * 2);
  tail.push([hx - R * 0.95, hy + wag * 0.6, R * 0.5], [hx - R * 1.65, hy - wag * 0.8, R * 0.32]);
  cycle(t, D, 6, S, (r) => r.range(0.26, 0.4), (age, life, r) => {
    const k = age / life, x = hx - R * 1.7 - age * r.range(55, 85), y = hy + r.range(-0.7, 0.7) * R * Math.min(1, k * 2);
    tail.push([x, y, R * r.range(0.36, 0.5) * (1 - k) ** 0.7]);
  });
  const field = (list, x, y) => {
    let f = 0;
    for (const [bx, by, br] of list) {
      const dx = x - bx, dy = y - by;
      f += (br * br) / (dx * dx + dy * dy + 0.05);
    }
    return f;
  };
  p.shade(hx - R * 2 - 34, hy - R * 1.6, hx + R * 1.5, hy + R * 1.6, (x, y) => {
    const h = field(head, x, y), f = h + field(tail, x, y);
    if (f < 1) return;
    if (h > 6) return WHITE; // only the head runs white-hot; the goo behind tops out a step lower
    return Math.min(f, h + 3.5) > 3.4 ? at(C, 0.84) : f > 2 ? at(C, 0.7) : f > 1.35 ? at(C, 0.56) : at(C, 0.42);
  });
  // fizz: single motes spat out behind
  cycle(t, D, 6, S + 1, (r) => r.range(0.15, 0.3), (age, life, r) => {
    const k = age / life, x = hx - R * 0.8 - age * r.range(40, 90), y = hy + r.sign() * (R * 0.7 + age * r.range(12, 30));
    if (k < 0.75) p.px(x, y, k < 0.35 ? at(C, 0.8) : at(C, 0.58));
  });
  const pulse = 0.88 + 0.12 * Math.sin(ph * TAU * 2);
  p.glow(hx - 2, hy, R * 3.2, at(C, 0.55), 0.3 * pulse);
  p.glow(hx, hy, R * 1.4, at(C, 0.8), 0.35 * pulse);
}
