// Faceted crystals frame an underground reservoir; falling water and light pulses stay at the edges.
import { fit, mix, rand, TAU, crystal } from "../../core/index.js";
import { bake, blit, sky, mist } from "./_lib.js";
import { contour, limb, rock } from "./_nature.js";

export const meta = {
  name: "Crystal Hollow",
  desc: "An underground reservoir framed by violet crystal clusters: cyan facets breathe with light, a narrow waterfall feeds the pool and drops open small rings in the dark.",
  tags: ["map", "crystal", "cavern", "waterfall", "magic", "fantasy", "arena", "loop"],
  kind: "map", size: [320, 180], origin: [0, 0], duration: 10, loop: true, fps: 30, bg: "dark",
  options: { palette: ["#080b1b", "#12162c", "#232443", "#393960", "#555482", "#7888b0", "#8cddd9", "#dbfcf1"], seed: 1 },
};

export const map = {
  groundY: 150, bounds: [8, 312], walk: [[8, 312]], platforms: [],
  spawns: { hero: [54, 150], mobs: [[148, 150], [194, 150]], boss: [264, 150] },
  arena: { x0: 8, x1: 312, groundY: 150 },
};

const W = 320, H = 180, D = meta.duration;
const CLUSTERS = [[26, 148, 65, 22, 8], [12, 149, 36, 16, -5], [44, 148, 29, 14, -5], [288, 149, 55, 23, -9], [306, 148, 34, 18, 3], [273, 149, 23, 13, 4]];
const DRIPS = [[85, 37], [114, 28], [163, 24], [197, 34], [226, 44]];

function prism(p, x, base, h, w, lean, C) {
  const tip = [x + lean, base - h], left = [x - w * 0.42 + lean * 0.6, base - h * 0.76];
  const right = [x + w * 0.36 + lean * 0.6, base - h * 0.69], ridge = x - w * 0.12;
  p.poly([tip, left, [x - w * 0.5, base - 5], [x - 1, base], [x + w * 0.5, base - 5], right], C[2]);
  p.poly([tip, left, [x - w * 0.5, base - 5], [ridge, base - 2]], C[5]);
  p.poly([tip, [ridge, base - 2], [x + w * 0.5, base - 5], right], C[3]);
  p.poly([tip, right, [x + w * 0.2, base - 5]], C[4]);
  p.polyline([left, tip, [ridge, base - 2]], C[6]);
  p.line(left[0], left[1], x - w * 0.5, base - 5, C[4]);
  p.line(tip[0], tip[1] + 1, tip[0] - 1, tip[1] + 5, C[7]);
}

function build(C, seed) {
  const back = bake(W, H, (p) => {
    sky(p, W, H, C[0], mix(C[1], C[6], 0.1), { horizon: 155 });
    const far = [C[0], C[0], mix(C[0], C[2], 0.5), C[1], C[2]];
    const stone = [C[0], C[1], C[2], C[3], mix(C[3], C[5], 0.35)];
    // Overlapping rock masses make an asymmetric vault, with deep seams between the planes.
    for (const [i, shape] of [[12, 76, 82, 93], [305, 71, 84, 90], [151, -7, 176, 58]].entries()) {
      rock(p, ...shape, far, { seed: seed + i * 13 });
    }
    const bank = contour([[40, 139], [78, 127], [119, 132], [162, 123], [208, 128], [248, 122], [282, 142]]);
    p.poly([...bank, [282, 150], [40, 150]], mix(C[1], C[6], 0.13));
    for (let i = 0; i < 44; i++) {
      const x = 64 + rand(seed, i, 1) * 194, y = 129 + rand(seed, i, 2) * 18;
      p.rect(x, y, 3 + rand(seed, i, 3) * 11, 1, mix(C[3], C[6], 0.2));
    }
    for (const [i, shape] of [[-12, 68, 62, 91], [-4, 129, 42, 37], [8, 4, 60, 38],
      [73, -3, 41, 33], [127, -10, 30, 31], [177, -7, 39, 30], [226, 5, 38, 38],
      [282, 10, 51, 40], [328, 75, 69, 84], [314, 131, 35, 30]].entries()) {
      rock(p, ...shape, stone, { seed: seed + i * 17 + 7 });
    }
    DRIPS.forEach(([x, y], i) => limb(p, [[x - 2, 13], [x + 1, (y + 13) / 2], [x, y]],
      7 + i % 3, 0.6, stone, { seed: seed + i, bark: false }));
    // A few distant, dim crystals establish scale behind the reservoir.
    for (const [x, h] of [[92, 17], [106, 26], [207, 22], [219, 13]]) crystal(p, x, 127, h, 10, 2, C.slice(0, 6));
    rock(p, 239, 57, 13, 8, stone, { seed: seed + 50 });
    p.poly(contour([[234, 57], [236, 79], [233, 106], [235, 135], [240, 138], [237, 105], [240, 78], [239, 57]]), C[3]);
    p.polyline(contour([[237, 60], [238, 81], [235, 107], [238, 136]]), C[5]);
  });
  const floor = bake(W, H, (p) => {
    p.rect(0, 150, W, 30, C[1]);
    const stone = [C[0], C[1], mix(C[1], C[2], 0.7), C[2], C[3]];
    for (let i = 0; i < 15; i++) {
      const x = -3 + i * 24 + rand(seed, i, 37) * 8;
      rock(p, x, 174, 17 + rand(seed, i, 38) * 10, 17, stone, { seed: seed + i * 19 });
    }
    p.rect(0, 150, W, 3, C[2]);
    for (let x = 0; x < W; x++) p.px(x, 150, x % 17 < 12 ? C[3] : C[2]);
    for (const [i, x] of [9, 36, 282, 310].entries()) rock(p, x, 149, 12, 5, stone, { seed: seed + i });
    for (const [x, y, h, w, lean] of CLUSTERS) {
      prism(p, x, y, h, w, lean, C);
      p.glow(x + lean * 0.4, y - h * 0.5, 28, C[6], 0.16);
      p.ellipse(x, y + 5, w, 2, C[2]);
    }
    for (const [x, y, endX, endY] of [[24, 157, 75, 169], [294, 155, 238, 171]]) {
      p.polyline(contour([[x, y], [(x + endX) / 2, y + 1], [endX, endY]]), C[0]);
    }
    for (let i = 0; i < 26; i++) {
      const x = 8 + rand(seed, i, 8) * 304, y = 163 + rand(seed, i, 9) * 14;
      p.rect(x, y, 2 + rand(seed, i, 10) * 4, 1, C[2]);
      if (x < 65 || x > 260) p.px(x, y - 1, C[4]);
    }
  });
  return { back, floor };
}

export function create(o) {
  const C = fit(o.palette, 8), seed = o.seed ?? 1, L = build(C, seed);
  let t = 0;
  return {
    update(dt) { t += dt; },
    draw(p) {
      const u = (t % D) / D, ph = u * TAU;
      blit(p, L.back);
      for (let i = 0; i < 12; i++) {
        const q = (u * 8 + i / 12) % 1, y = 61 + q * 73, x = 237 + Math.sin((y - 61) * 0.085) * 1.4;
        p.line(x + i % 2 - 1, y, x + i % 2 - 1, y + 3, C[6], Math.sin(q * Math.PI) * 0.65);
      }
      for (let i = 0; i < 6; i++) {
        const q = (u * 5 + i / 6) % 1;
        const a = Math.sin(q * Math.PI) * 0.45, rx = 1 + q * 9;
        p.line(237 - rx, 137 + q * 3, 237 + rx, 137 + q * 3, C[5], a);
      }
      // Drops accelerate into the reservoir; ripples begin only after contact.
      for (let i = 0; i < 5; i++) {
        const q = (u * 4 + i / 5) % 1, [x, start] = DRIPS[i], bottom = 137 + i % 2 * 5;
        if (q < 0.65) {
          const k = q / 0.65, y = start + k * k * (bottom - start);
          p.line(x, y, x, y + 2, C[6], Math.sin(k * Math.PI) * 0.7);
        } else {
          const k = (q - 0.65) / 0.35;
          for (let j = 0; j < 28; j++) {
            const a = j / 28 * TAU;
            p.dot(x + Math.cos(a) * (1 + k * 9), bottom + Math.sin(a) * (0.5 + k * 1.5), C[6], (1 - k) * 0.6);
          }
        }
      }
      mist(p, t % D, D, { y0: 123, y1: 143, color: "#8398b8", seed, bands: 1, alpha: 0.045 });
      blit(p, L.floor);
      for (let i = 0; i < CLUSTERS.length; i++) {
        const [x, y, h, , lean] = CLUSTERS[i], pulse = 0.5 + 0.5 * Math.sin(ph * 2 - i * 0.8);
        p.glow(x + lean * 0.5, y - h * 0.5, 24, C[6], 0.08 + pulse * 0.14);
        const k = (u * 2 + i * 0.17) % 1;
        p.dot(x - 2 + (lean + 2) * k, y - h * k, C[7], Math.sin(k * Math.PI) * 0.9);
      }
      for (let i = 0; i < 19; i++) {
        const x = 16 + rand(seed, i, 20) * 288 + Math.sin(ph + i) * 4;
        const y = 48 + rand(seed, i, 21) * 85 + Math.cos(ph * 2 + i) * 3;
        const a = 0.3 + 0.3 * Math.sin(ph * 2 + i * 1.7);
        p.dot(x, y, C[6], a);
        p.glow(x, y, 4, C[6], a * 0.15);
      }
    },
  };
}
