// Ancient roots and luminous fungi surround a flooded marsh; the stone causeway remains dry and level.
import { fit, mix, rand, TAU } from "../../core/index.js";
import { bake, blit, sky, mushroom, fern, mist } from "./_lib.js";
import { contour, limb, rock, marshTree } from "./_nature.js";

export const meta = {
  name: "Wisp Marsh",
  desc: "A flooded twilight marsh crossed by a stone causeway: ghost lights drift between crooked roots, luminous mushrooms shed spores and bubbles spread rings across the black water.",
  tags: ["map", "swamp", "water", "mushroom", "wisp", "fantasy", "arena", "loop"],
  kind: "map", size: [320, 180], origin: [0, 0], duration: 12, loop: true, fps: 30, bg: "dark",
  options: { palette: ["#080d19", "#111c27", "#1b3037", "#2c484b", "#466764", "#6b9990", "#8ed7bf", "#d5f4c9"], seed: 1 },
};

export const map = {
  groundY: 150, bounds: [8, 312], walk: [[8, 312]], platforms: [],
  spawns: { hero: [54, 150], mobs: [[146, 150], [198, 150]], boss: [264, 150] },
  arena: { x0: 8, x1: 312, groundY: 150 },
};

const W = 320, H = 180, D = meta.duration;
const FUNGI = [[22, 145, 6], [37, 149, 3.2], [284, 145, 7], [302, 149, 3.5]];

function build(C, seed) {
  const back = bake(W, H, (p) => {
    sky(p, W, H, mix(C[0], C[3], 0.15), C[2], { horizon: 140 });
    for (let i = 0; i < 9; i++) {
      const x = i * 42 - 5 + rand(seed, i, 1) * 22, h = 82 + rand(seed, i, 2) * 38;
      const far = [C[0], C[1], mix(C[1], C[2], 0.36), mix(C[1], C[2], 0.48), C[2]];
      marshTree(p, x, 133, h, 6 + rand(seed, i, 3) * 3, far, { seed: seed + i * 17, lean: (rand(seed, i, 4) - 0.5) * 23, detail: false });
    }
    const mid = [C[0], C[1], C[2], mix(C[2], C[3], 0.3), C[3]];
    marshTree(p, 76, 139, 110, 11, mid, { seed: seed + 40, lean: -12, detail: false });
    marshTree(p, 249, 137, 98, 12, mid, { seed: seed + 71, lean: 9, detail: false });
    const bank = contour([[0, 130], [30, 128], [66, 137], [102, 132], [151, 135], [196, 129], [239, 133], [279, 126], [320, 131]]);
    p.poly([...bank, [320, 150], [0, 150]], C[1]);
    for (let i = 0; i < 65; i++) {
      const x = rand(seed, i, 3) * W, y = 129 + rand(seed, i, 4) * 20;
      p.rect(x, y, 2 + rand(seed, i, 5) * 12, 1, C[2]);
    }
    for (const [x, y] of [[78, 134], [112, 144], [238, 136], [260, 142]]) {
      p.ellipse(x, y, 5, 1.3, C[3]);
      p.line(x, y, x + 4, y, C[2]);
    }
    const wood = [C[0], mix(C[0], C[2], 0.65), C[2], C[3], C[4]];
    marshTree(p, 12, 150, 143, 23, wood, { seed: seed + 7, lean: 13 });
    marshTree(p, 309, 150, 151, 27, wood, { seed: seed + 29, lean: -11 });
    // One root curls around an exposed hollow; its taper is visible above the water.
    limb(p, [[19, 143], [28, 136], [39, 139], [43, 148]], 6, 1, wood, { seed });
    limb(p, [[302, 144], [291, 133], [279, 137], [274, 149]], 7, 1, wood, { seed: seed + 1 });
  });
  const floor = bake(W, H, (p) => {
    p.rect(0, 150, W, 12, C[1]);
    const stone = [C[0], C[1], C[2], C[3], C[4]];
    for (let i = 0, x = -4; x < W; i++) {
      const w = 12 + Math.floor(rand(seed, i, 31) * 15);
      rock(p, x + w / 2, 156, w * 0.67, 6, stone, { seed: seed + i * 13, moss: [C[2], C[3]] });
      p.rect(x, 150, w, 2, C[2]);
      p.line(x, 150, x + w - 2, 150, C[3]);
      x += w;
    }
    // Dark water below the causeway, with brighter plants restricted to the margins.
    p.rect(0, 162, W, 18, C[1]);
    for (let i = 0; i < 42; i++) {
      const x = rand(seed, i, 8) * W, y = 164 + rand(seed, i, 9) * 14;
      p.rect(x, y, 3 + rand(seed, i, 10) * 8, 1, C[2]);
    }
    for (const [x, y, s] of FUNGI) mushroom(p, x, y, s, C);
    for (const [i, x] of [8, 28, 291, 312].entries()) rock(p, x, 152, 9, 5, stone, { seed: seed + i * 21, moss: [C[3], C[4]] });
    for (const x of [8, 43, 275, 314]) fern(p, x, 151, 3, C, seed + x);
    for (let i = 0; i < 24; i++) {
      const x = i < 12 ? 2 + i * 3 : 283 + (i - 12) * 3, h = 4 + rand(seed, i, 11) * 11;
      p.line(x, 179, x + 2, 179 - h, C[3]);
      if (i % 4 === 0) p.rect(x + 1, 178 - h, 2, 4, C[4]);
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
      mist(p, t % D, D, { y0: 102, y1: 141, color: "#93b9b0", seed, bands: 2, alpha: 0.075 });
      for (let i = 0; i < 5; i++) {
        const x = 69 + i * 42 + Math.sin(ph + i * 2) * 10, y = 89 + i % 3 * 13 + Math.cos(ph * 2 + i) * 5;
        const a = 0.55 + 0.25 * Math.sin(ph * 2 + i);
        p.glow(x, y, 9, C[6], a * 0.28);
        p.disc(x, y, 1.8, C[6], a * 0.65);
        p.dot(x, y - 1, C[7], a);
        p.dot(x - 1, y + 2, C[5], a * 0.4);
        p.line(x - 3, 140 + i % 2 * 3, x + 3, 140 + i % 2 * 3, C[5], a * 0.35);
      }
      blit(p, L.floor);
      for (let i = 0; i < FUNGI.length; i++) {
        const [x, y, s] = FUNGI[i];
        p.glow(x, y - s * 2, 14, C[6], 0.07 + 0.045 * Math.sin(ph * 2 + i));
        for (let j = 0; j < 4; j++) {
          const q = (u * 2 + j / 4 + i * 0.19) % 1;
          const px = x + Math.sin(ph * 2 + j * 2 + i) * 6, py = y - s * 2 - q * 28;
          p.dot(px, py, C[7], Math.sin(q * Math.PI) * 0.7);
        }
      }
      for (let i = 0; i < 8; i++) {
        const q = (u * 3 + i / 8) % 1, x = 50 + i * 30, y = 169 + i % 3 * 3;
        if (q < 0.16) p.dot(x, y - Math.sin(q / 0.16 * Math.PI) * 2, C[5], Math.sin(q / 0.16 * Math.PI) * 0.8);
        for (let j = 0; j < 24; j++) {
          const a = j / 24 * TAU;
          p.dot(x + Math.cos(a) * (1 + q * 7), y + Math.sin(a) * (0.5 + q * 1.4), C[4], Math.sin(q * Math.PI) * 0.65);
        }
      }
    },
  };
}
