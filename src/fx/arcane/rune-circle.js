import { PAL, cycle, TAU, WHITE } from "../../core/index.js";
import { fit, rune, ovalLine, ahead } from "./_lib.js";

export const meta = {
  name: "Rune circle",
  desc: "A magic circle on the floor: a band of runes turning one way, a triangle the other, a spark racing round the rim, motes rising.",
  tags: ["arcane", "circle", "runes", "ground", "magic", "aura", "loop"],
  size: [72, 52],
  origin: [36, 36],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.arcane, radius: 27, seed: 10 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), D = meta.duration, ph = t / D, RX = o.radius, RY = Math.round(RX * 0.43), S = o.seed;
  const pulse = 0.75 + 0.25 * Math.sin(ph * TAU * 2);
  const spark = ph * TAU * 2 - Math.PI / 2; // a bright head racing round the rim, two laps a loop
  const near = (ang) => Math.sin(ang) > -0.15; // the front half is closer: one step brighter
  // a pool of light on the floor inside the circle (light only, no pixels)
  p.shade(-RX, -RY, RX, RY, (x, y, out) => {
    const d = Math.hypot(x / RX, y / RY);
    if (d > 1) return;
    out.l = C[4];
    out.k = 0.14 * (1 - d * d) * pulse;
  });
  // the rune band is inked dark so the glyphs stand out on it
  p.shade(-RX, -RY, RX, RY, (x, y) => {
    const d = Math.hypot(x / RX, y / RY);
    if (d < 1 && d > 0.64) return C[1];
  });
  // outer rim with the spark and its fading tail
  ovalLine(p, RX, RY, (ang) => {
    const behind = ahead(ang, spark);
    if (behind < 0.12) return WHITE;
    if (behind < 0.7) return C[6];
    return near(ang) ? C[5] : C[4];
  });
  // inner ring and a triangle turning against the runes (a third of a turn a loop: seamless)
  const ri = 0.64;
  ovalLine(p, RX * ri, RY * ri, (ang) => (near(ang) ? C[5] : C[4]));
  const vx = (k) => {
    const a = -ph * (TAU / 3) + (k * TAU) / 3 - Math.PI / 2;
    return [Math.cos(a) * RX * ri, Math.sin(a) * RY * ri];
  };
  for (let k = 0; k < 3; k++) {
    const [x0, y0] = vx(k), [x1, y1] = vx(k + 1);
    p.line(x0, y0, x1, y1, (u) => (y0 + (y1 - y0) * u > 0 ? C[5] : C[4]));
  }
  ovalLine(p, RX * 0.2, RY * 0.2, C[5]);
  // the rune band: twelve runes, a three-glyph pattern, a quarter turn a loop (seamless)
  const glyphs = [S % 8, (S + 3) % 8, (S + 5) % 8];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + ph * (TAU / 4), x = Math.cos(a) * RX * 0.8, y = Math.sin(a) * RY * 0.8;
    const lit = ahead(a, spark) < 0.5;
    rune(p, glyphs[i % 3], x, y, lit ? WHITE : near(a) ? C[6] : C[5], 1, true);
    if (lit) p.light(x, y, C[5], 0.5);
  }
  // motes lifting off the rim
  cycle(t, D, 16, S, (r) => r.range(0.8, 1.4), (age, life, r) => {
    const k = age / life, a = r.range(0, TAU), rr = r.range(0.75, 1);
    const x = Math.cos(a) * RX * rr + Math.sin(age * r.range(3, 6) + r.next() * TAU) * 1.2;
    const y = Math.sin(a) * RY * rr - age * r.range(8, 16);
    p.dot(x, y, k < 0.3 ? WHITE : k < 0.65 ? C[6] : C[5], k < 0.7 ? 1 : (1 - k) / 0.3);
    p.light(x, y, C[5], 0.35 * (1 - k));
  });
  p.glow(0, -3, RX + 8, C[4], 0.14 * pulse);
}
