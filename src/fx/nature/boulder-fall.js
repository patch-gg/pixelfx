// Falling stone and an earth-magic impact, using the library's faceted rocks and debris simulation.
import { Particles, Bits, Lights, P, PF, B, Rng, fit, band, smooth, clamp, TAU } from "../../core/index.js";
import { stoneShape, drawRock } from "./_lib.js";

export const meta = {
  name: "Boulder fall",
  desc: "A rune-bound boulder hangs overhead, plummets onto an earth sigil and shatters into heavy bouncing slabs, golden fault lines and settling ochre dust.",
  tags: ["earth", "stone", "boulder", "fall", "spell", "impact", "shatter", "one-shot"],
  size: [320, 264],
  origin: [160, 230],
  duration: 3.6,
  fps: 30,
  loop: false,
  bg: "ground",
  options: {
    palette: ["#191419", "#33272a", "#504034", "#735b40", "#9b7c50", "#c5a569", "#edd196", "#fff1c7"],
    seed: 17,
  },
};

const RELEASE = 0.2, HIT = 0.9, RADIUS = 36;

// The optional material is used by meteor-fall and ice-block-fall; the earth effect keeps its defaults.
export function create(o, material = "earth") {
  const meteor = material === "meteor", ice = material === "ice";
  const C = fit(o.palette, 8), R = new Rng(o.seed), floor = () => 0;
  const stone = meteor ? [C[0], C[0], C[1], C[1], C[2], C[2], C[3], C[4]] : C;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[7], C[6], C[5], C[3]] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  const rockShape = stoneShape(R, 8);
  const shape = ice ? [[-0.7, -0.65], [-0.1, -1], [0.72, -0.66], [0.85, 0.45], [0.1, 0.83], [-0.8, 0.45]] : rockShape;
  // Precompute the scars: drawing never consumes randomness.
  const cracks = Array.from({ length: 9 }, (_, i) => {
    const a = i * TAU / 9 + R.range(-0.15, 0.15), length = R.range(36, 66);
    return Array.from({ length: 5 }, (_, j) => {
      const d = length * j / 4;
      return [Math.cos(a) * d + (j ? R.range(-3, 3) : 0), Math.sin(a) * d * 0.24];
    });
  });
  let t = 0, hit = false;
  const height = () => -166 + (166 - RADIUS) * clamp((t - RELEASE) / (HIT - RELEASE)) ** 2;
  const impact = () => {
    lights.add(0, -12, 65, C[6], 0.65, 0.32);
    lights.add(0, -12, 30, C[7], 0.85, 0.08);
    // A few weighty slabs are the silhouette; smaller chips fill the gaps.
    for (let i = 0; i < 23; i++) {
      const side = i % 2 ? -1 : 1, big = i < 7;
      bits.add({ kind: B.CHUNK, x: R.range(-14, 14), y: -R.range(8, 28),
        vx: side * R.range(big ? 35 : 55, big ? 115 : 160), vy: -R.range(big ? 105 : 70, big ? 235 : 220),
        g: 0.65, drag: 0.65, bounce: big ? 0.26 : 0.36, life: R.range(1.7, 2.2),
        a: R.range(0, TAU), va: side * R.range(2, 9), s: big ? R.range(10, 16) : R.range(2, 4.5),
        pts: ice ? [[-0.35, -1.15], [0.55, -0.7], [0.4, 0.65], [-0.55, 1]] : stoneShape(R) });
    }
    for (let i = 0; i < 65; i++) {
      const a = R.range(-Math.PI + 0.2, -0.2), v = R.range(65, 245);
      ps.spawn(P.GRIT, R.range(-17, 17), -R.range(1, 12), Math.cos(a) * v, Math.sin(a) * v,
        R.range(0.8, 1.6), R.pick([C[3], C[4], C[5], C[6]]), R.chance(0.25) ? 2 : 1);
    }
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? -1 : 1;
      ps.spawn(ice ? P.VAPOUR : P.SMOKE, side * R.range(7, 23), -R.range(2, 10), side * R.range(30, 95), -R.range(6, 35),
        R.range(0.9, 1.65), ice ? C[6] : meteor ? C[1] : i % 3 ? C[4] : C[3], R.range(4, 8), R.range(0, 0.08), PF.BIG);
    }
    for (let i = 0; i < 14; i++) {
      const a = R.range(-Math.PI, 0), v = R.range(80, 200);
      ps.spawn(P.SPARK, 0, -12, Math.cos(a) * v, Math.sin(a) * v, R.range(0.12, 0.3));
    }
    if (meteor || ice) for (let i = 0; i < 32; i++) {
      ps.spawn(ice ? P.FLAKE : P.EMBER, R.range(-25, 25), -R.range(5, 35), R.range(-85, 85), -R.range(25, 135),
        R.range(0.8, 1.65), C[6], R.range(0.7, 1.8));
    }
  };
  const shock = (p, back) => {
    const u = (t - HIT) / 0.42;
    if (u < 0 || u >= 1) return;
    band(p, 0, 1, 16 + 88 * (1 - (1 - u) ** 3), 0.2, 3 * (1 - u) + 1,
      1 - u, [C[2], C[4], C[6], C[7]], g => (Math.sin(g) < 0) === back);
  };
  const drawStone = (p, y, angle, white = false) => {
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const at = ([x, yy]) => [x * ca - yy * sa, y + x * sa + yy * ca];
    // The main rock exceeds drawRock's small-debris mask: rasterize its broad facets directly.
    const V = shape.map(([x, yy]) => at([x * RADIUS, yy * RADIUS]));
    for (let i = 0; i < V.length; i++) {
      const a = V[i], b = V[(i + 1) % V.length], dx = b[0] - a[0], dy = b[1] - a[1];
      const light = (dy * -0.6 + dx * 0.8) / Math.hypot(dx, dy);
      p.tri(-3, y - 5, ...a, ...b, white ? C[7] : light > 0.5 ? stone[6] : light > 0 ? stone[5] : light > -0.5 ? stone[3] : stone[2]);
      p.line(...a, ...b, white ? C[7] : light > 0.3 ? stone[7] : ice ? C[3] : C[0]);
    }
    if (white) return;
    // Angular seams make it a conjured stone, with light kept on narrow lines.
    for (const path of [[[-8, -15], [-3, -5], [-8, 1], [0, 8], [3, 17]], [[-3, -5], [6, -8], [14, -3]]]) {
      p.polyline(path.map(([x, yy]) => at([x * 1.4, yy * 1.4])), C[1]);
      p.polyline(path.map(([x, yy]) => at([x * 1.4 + 1, yy * 1.4])), C[6], 0.85);
    }
    if (ice) {
      for (const x of [-12, -7]) p.line(...at([x, -23]), ...at([x + 14, 12]), C[7], x === -12 ? 0.9 : 0.45);
    }
    if (meteor) p.glow(0, y, 43, C[4], 0.35);
  };
  return {
    update(dt) {
      t += dt;
      if (!hit && t >= HIT) { hit = true; impact(); }
      const chance = Math.min(1, dt * 120);
      if ((meteor || ice) && t > RELEASE && t < HIT && R.chance(0.45 * chance)) {
        ps.spawn(ice ? P.FLAKE : P.EMBER, R.range(-21, 21), height() - R.range(15, 30),
          R.range(-15, 15), -R.range(8, 25), R.range(0.18, 0.35), C[6], R.range(0.7, 1.4));
      }
      if (ice && t > RELEASE && t < HIT && R.chance(0.18 * chance)) {
        ps.spawn(P.VAPOUR, R.range(-24, 24), height() - 12, R.range(-8, 8), -12, 0.32, C[5], R.range(2, 4));
      }
      if (meteor && t > HIT && t < 2.25 && R.chance(0.22 * chance)) {
        ps.spawn(P.EMBER, R.range(-40, 40), -R.range(0, 4), R.range(-10, 10), -R.range(10, 30), 0.55, C[6], 1.2);
      }
      if (ice && t > HIT && t < 2.15 && R.chance(0.1 * chance)) {
        ps.spawn(P.STAR, R.range(-45, 45), -R.range(1, 8), 0, -3, 0.35, C[7], R.range(1, 2));
      }
      bits.update(dt);
      for (const b of bits.list) if (b.rest && !b.dusted) {
        b.dusted = true;
        ps.spawn(ice ? P.VAPOUR : P.DUST, b.x, -1, R.sign() * R.range(8, 25), -8, 0.35, C[4], 2.5);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      if (t >= meta.duration) return;
      if (t < HIT) {
        const k = smooth(0, 0.18, t), pulse = 0.65 + 0.25 * Math.sin(t * 13);
        p.ellipse(0, 1, 18 + 9 * t / HIT, 4 + 2 * t / HIT, C[0], k * 0.8);
        for (const radius of [28, 35]) band(p, 0, 0, radius, 0.23, 1, k * pulse, [C[2], C[4], C[5], C[6]]);
        for (let i = 0; i < 8; i++) {
          const a = i * TAU / 8, x = Math.cos(a) * 31, y = Math.sin(a) * 7;
          p.line(x - 2, y - 1, x + 2, y + 1, C[6], k);
        }
      } else {
        const age = t - HIT, fade = 1 - smooth(2.7, 3.35, t), grow = clamp(age / 0.13);
        p.ellipse(0, 1, 32, 7, C[0], fade);
        p.ellipse(0, 0, 26, 4, C[1], fade);
        if (ice) {
          for (let x = -52; x <= 52; x += 2) {
            const edge = 1 - Math.abs(x) / 54;
            p.line(x, -1, x, -1 - 3 * edge, C[6], fade * edge * Math.min(1, age * 5));
          }
        }
        if (meteor) {
          const heat = 1 - smooth(1.05, 2.8, t);
          p.glow(0, -2, 62, C[4], heat * 0.3);
          p.ellipse(0, 0, 24, 3, C[3], heat * 0.8);
        }
        for (const path of cracks) {
          const n = Math.max(2, Math.ceil(path.length * grow));
          p.polyline(path.slice(0, n), C[0], fade);
          if (age < 0.6) p.polyline(path.slice(0, n).map(([x, y]) => [x, y - 1]), C[6], (1 - age / 0.6) * 0.8);
        }
      }
      shock(p, true);
      ps.draw(p, "back");
    },
    draw(p) {
      if (t >= meta.duration) return;
      if (t < HIT) {
        const y = height(), a = -0.22 + t * 0.5;
        if (meteor) {
          const speed = clamp((t - RELEASE) / (HIT - RELEASE));
          // A tapered, layered fire wake follows the falling body without hiding its dark core.
          for (let i = 0; i < 5; i++) {
            const x = (i - 2) * 11, base = y - 11;
            const length = 22 + speed * (65 - Math.abs(i - 2) * 17 + Math.sin(t * 27 + i * 4) * 7);
            const sway = Math.sin(t * 31 + i * 2) * (3 + speed * 3);
            p.tri(x - 8, base, x + 8, base, x + sway, base - length, C[3]);
            p.tri(x - 5, base, x + 5, base, x + sway * 0.7, base - length * 0.78, C[5]);
            p.tri(x - 2, base, x + 3, base, x + sway * 0.4, base - length * 0.5, C[7]);
          }
        }
        if (t > RELEASE) {
          const speed = clamp((t - RELEASE) / (HIT - RELEASE));
          for (const x of [-17, -7, 8, 18]) {
            const end = y - 24 - Math.abs(x) * 0.15;
            p.line(x, end - 5 - 22 * speed, x, end, C[5], 0.5 * speed);
          }
        }
        drawStone(p, y, a);
        p.glow(0, y, 36, C[5], 0.12);
      }
      const age = t - HIT;
      if (age >= 0 && age < 0.045) drawStone(p, -RADIUS, -0.22 + HIT * 0.5, true);
      if (age >= 0 && age < 0.16) {
        const u = age / 0.16;
        for (let i = 0; i < 9; i++) {
          const a = -Math.PI + i * Math.PI / 8, r = 20 + u * 34, len = 18 * (1 - u);
          p.line(Math.cos(a) * r, -12 + Math.sin(a) * r * 0.7,
            Math.cos(a) * (r + len), -12 + Math.sin(a) * (r + len) * 0.7, C[7], 1 - u);
        }
      }
      // Bits tracks its floor contact point; lift each drawn centre by the rock's lower radius.
      for (const b of bits.list) {
        const size = b.s * (ice ? 1 - 0.4 * smooth(1.35, 2.2, age) : 1);
        drawRock(p, b.x, b.y - size * 0.8, size, b.a, b.pts, stone, Math.min(1, b.life / 0.5));
        if (meteor && age < 1.4) {
          p.line(b.x - b.s * 0.3, b.y - b.s, b.x + b.s * 0.2, b.y - b.s * 0.6, C[5], 1 - smooth(0.4, 1.4, age));
          p.glow(b.x, b.y - b.s * 0.7, b.s + 4, C[4], 0.2 * (1 - age / 1.4));
        }
      }
      ps.draw(p, "front");
      shock(p, false);
      lights.draw(p);
    },
  };
}
