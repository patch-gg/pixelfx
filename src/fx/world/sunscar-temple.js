// Warm sandstone, a stepped sanctuary and windblown dust; the playable floor is continuous.
import { fit, mix, rand, TAU } from "../../core/index.js";
import { bake, blit, sky, pillar } from "./_lib.js";

export const meta = {
  name: "Sunscar Temple",
  desc: "A sandstone sanctuary half buried in sunset dunes: wind carries sand through broken columns, torn banners sway and a sun seal glows above the distant temple door.",
  tags: ["map", "desert", "temple", "sand", "sunset", "fantasy", "arena", "loop"],
  kind: "map", size: [320, 180], origin: [0, 0], duration: 12, loop: true, fps: 30, bg: "dark",
  options: { palette: ["#201822", "#392631", "#573741", "#795044", "#a6714e", "#c39361", "#e6bc7e", "#ffdfa0"], seed: 1 },
};

export const map = {
  groundY: 150, bounds: [8, 312], walk: [[8, 312]], platforms: [],
  spawns: { hero: [54, 150], mobs: [[148, 150], [196, 150]], boss: [264, 150] },
  arena: { x0: 8, x1: 312, groundY: 150 },
};

const W = 320, H = 180, D = meta.duration;

function build(C, seed) {
  const back = bake(W, H, (p) => {
    sky(p, W, H, C[1], C[5], { horizon: 140 });
    p.circle(244, 48, 23, C[6]);
    p.glow(244, 48, 52, C[5], 0.12);
    for (let i = 0; i < 5; i++) p.rect(217, 48 + i * 5, 55, 1 + i % 2, mix(C[3], C[5], i * 0.1));
    for (let layer = 0; layer < 3; layer++) {
      for (let x = 0; x < W; x++) {
        const y = 103 + layer * 12 + Math.round(Math.sin(x * 0.016 + layer * 2 + seed) * (13 - layer * 2));
        p.rect(x, y, 1, H - y, C[2 + layer]);
      }
    }
    for (const [x, h] of [[82, 24], [227, 17]]) {
      p.poly([[x - 3, 122], [x - 2, 122 - h], [x, 119 - h], [x + 3, 122 - h], [x + 4, 122]], C[2]);
      p.line(x - 2, 123 - h, x - 2, 119, C[3]);
    }
    // Distant sandstone steps and a recessed doorway, darker than the foreground stone.
    for (let i = 0; i < 6; i++) {
      const w = 104 - i * 13, y = 119 - i * 9;
      p.rect(164 - w / 2, y, w, 11, C[3]);
      p.rect(164 - w / 2, y, w, 1, C[4]);
      p.rect(164 + w / 2 - 3, y + 1, 3, 10, C[2]);
    }
    p.rect(151, 98, 26, 32, C[1]);
    p.rect(154, 101, 20, 29, C[0]);
    p.rect(149, 95, 30, 3, C[4]);
    p.rect(147, 130, 34, 2, C[5]);
    p.rect(140, 134, 48, 2, C[4]);
    p.circle(164, 83, 5, C[2]);
    p.ring(164, 83, 4, 1, C[5]);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      p.line(164 + Math.cos(a) * 7, 83 + Math.sin(a) * 7, 164 + Math.cos(a) * 9, 83 + Math.sin(a) * 9, C[4]);
    }
  });
  const sides = bake(W, H, (p) => {
    for (const [x, h, w] of [[12, 103, 17], [43, 61, 12], [270, 70, 13], [298, 112, 16]]) {
      pillar(p, x, 150, w, h, C, { broken: true });
      p.rect(x + 3, 150 - h + 7, 2, h - 15, C[4]);
      for (let y = 150 - h + 12; y < 140; y += 13) {
        p.line(x + w - 5, y, x + w - 8, y + 4, C[1]);
        p.px(x + w - 7, y + 5, C[5]);
      }
    }
    for (const [x, y] of [[35, 65], [283, 71]]) {
      p.rect(x, y - 9, 1, 54, C[1]);
      p.rect(x - 1, y - 9, 3, 2, C[6]);
    }
  });
  const floor = bake(W, H, (p) => {
    p.rect(0, 150, W, 30, C[1]);
    for (let row = 0; row < 4; row++) {
      for (let x = -15 + row % 2 * 16; x < W; x += 32) {
        p.rect(x + 1, 152 + row * 7, 30, 6, C[2]);
        p.rect(x + 1, 152 + row * 7, 30, 1, C[3]);
        p.px(x + 3, 155 + row * 7, C[3]);
      }
    }
    for (let x = 0; x < W; x++) {
      const depth = Math.round(1 + Math.pow(Math.abs(x - 160) / 160, 3) * 10);
      p.rect(x, 151, 1, depth, C[4]);
      p.px(x, 150, C[5]);
    }
    for (let i = 0; i < 22; i++) {
      const x = 4 + rand(seed, i, 1) * 309, y = 162 + rand(seed, i, 2) * 15;
      p.line(x, y, Math.min(319, x + 4 + rand(seed, i, 3) * 9), y, C[3]);
    }
    for (const x of [20, 285]) {
      p.poly([[x - 5, 173], [x, 164], [x + 12, 164], [x + 19, 174]], C[2]);
      p.line(x, 164, x + 12, 164, C[5]);
      p.line(x + 12, 164, x + 19, 174, C[3]);
    }
  });
  return { back, sides, floor };
}

export function create(o) {
  const C = fit(o.palette, 8), seed = o.seed ?? 1, L = build(C, seed);
  let t = 0;
  return {
    update(dt) { t += dt; },
    draw(p) {
      const u = (t % D) / D, ph = u * TAU;
      blit(p, L.back);
      p.glow(164, 83, 13, C[6], 0.12 + 0.06 * Math.sin(ph * 2));
      blit(p, L.sides);
      for (const [x, y, offset] of [[35, 65, 0], [283, 71, 2]]) {
        for (let k = 0; k < 15; k++) {
          const sway = Math.sin(ph * 3 - k * 0.3 + offset) * k * 0.16;
          const top = y + Math.round(sway), length = 12 - k * 0.45 - (k % 4 === 0 ? 2 : 0);
          p.rect(x + k + 1, top, 1, length, k % 5 < 2 ? C[2] : C[1]);
          p.px(x + k + 1, top, C[4]);
        }
      }
      blit(p, L.floor);
      // A few readable streaks, with a long, soft fade at both ends of each travel path.
      for (let i = 0; i < 43; i++) {
        const q = (u * (2 + i % 2) + rand(seed, i, 10)) % 1;
        const x = 4 + q * 305, y = 82 + rand(seed, i, 11) * 65 + Math.sin(ph * 2 + i) * 2;
        const a = Math.sin(q * Math.PI) * (i % 5 ? 0.32 : 0.6);
        p.line(x, y, x + (i % 5 === 0 ? 5 : 1), y, C[6], a);
      }
      for (let i = 0; i < 6; i++) {
        const q = (u * 2 + i / 6) % 1, x = 8 + q * 294;
        p.line(x, 147 - i % 2, x + 9, 147 - i % 2, C[5], Math.sin(q * Math.PI) * 0.35);
      }
    },
  };
}
