// A moonlit forest clearing inside a broken elven ruin. The fight floor is deliberately quiet: detail lives in the
// arch, the tree line and the edges, while the strip between the hero and the boss stays low-contrast so characters read.
import { fit, hex, mix, lerp, rand, TAU } from "../../core/index.js";
import {
  bake, blit, sky, stars, moon, arch, pillar, ground, tufts, foliage, fern, mushroom,
  mist, fireflies, leaves, motes, pool,
} from "./_lib.js";

export const meta = {
  name: "Mossy Ruins",
  desc: "A moonlit clearing inside broken elven ruins: mist drifts over a cracked flagstone floor, fireflies wander the arch and leaves fall through the cold light.",
  tags: ["map", "forest", "ruins", "fantasy", "arena", "night", "loop"],
  kind: "map",
  size: [320, 180],
  origin: [0, 0],
  duration: 10,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#05080d", "#08140f", "#0e2218", "#173522", "#26502c", "#3f7238", "#6aa04c", "#a8d97a"],
    seed: 1,
  },
};

/** The game-facing layout of the arena. Units stand with their feet on groundY. */
export const map = {
  groundY: 150,
  bounds: [8, 312],
  walk: [[8, 312]],
  platforms: [],
  spawns: { hero: [54, 150], mobs: [[152, 150], [198, 150]], boss: [262, 150] },
  arena: { x0: 8, x1: 312, groundY: 150 },
};

const W = 320, H = 180, D = meta.duration;
const SKY_TOP = hex("#05040c"), SKY_LOW = hex("#132134");
const STONE = ["#090a10", "#12161f", "#1c2430", "#29343e", "#3b4a50", "#56656a", "#7e8d88", "#b8c4b2"].map(hex);
const WATER = ["#071018", "#0d2230", "#143a44", "#1f5860", "#3a8a8a", "#79c4b8"].map(hex);

function farTrees(p, baseY, seed, color) {
  const c = hex(color);
  for (let i = 0; i < 40; i++) {
    const x = Math.round(rand(seed, i, 1) * W), h = 8 + rand(seed, i, 2) * 22, w = 3 + rand(seed, i, 3) * 7;
    p.rect(x, baseY - h, 1, h, c);
    for (let k = 0; k < 3; k++) {
      const yy = baseY - h * (0.35 + k * 0.25), ww = w * (1 - k * 0.22);
      p.tri(x - ww, yy, x + ww, yy, x, yy - ww * 0.9, c);
    }
  }
}

function vine(p, x, y, len, C, seed = 0) {
  let px = x;
  for (let i = 0; i < len; i++) {
    px = x + Math.sin(i * 0.35 + seed) * 2.2;
    p.px(px, y + i, i % 4 === 0 ? C[5] : C[3]);
    p.px(px - 1, y + i, C[2]);
    if (i % 5 === 2) p.px(px + 1, y + i, C[5]);
  }
  for (let i = 0; i < 4; i++) foliage(p, x + Math.sin(i * 2.1 + seed) * 3, y + len * (0.3 + i * 0.18), 2.2, 1.6, C, seed + i, 3);
}

function bigTree(p, x, baseY, h, C) {
  const bark = ["#09080d", "#171410", "#292117", "#3d3020", "#5a4428"].map(hex);
  const top = baseY - h;
  // a tapering trunk with bark ridges and roots that spread into the floor
  for (let y = top; y < baseY; y++) {
    const u = (y - top) / h, hw = 1.8 + Math.pow(u, 1.3) * 7.5;
    for (let xx = Math.round(x - hw); xx <= Math.round(x + hw); xx++) {
      let c = bark[2];
      if (xx < x - hw * 0.42) c = bark[3];
      if (xx > x + hw * 0.5) c = bark[1];
      if ((xx + y) % 7 === 0) c = bark[1];
      p.px(xx, y, c);
    }
    if (u > 0.55) p.px(x - hw * 0.7, y, bark[4]);
  }
  for (let i = 0; i < 7; i++) {
    const dir = i % 2 ? 1 : -1, len = 5 + (i % 3) * 3;
    for (let k = 1; k <= len; k++) p.px(x + dir * k, baseY - 1 - Math.pow(k / len, 1.4) * 3, k > len - 3 ? bark[2] : bark[1]);
  }
  // three limbs reach up into the canopy instead of stopping under it
  for (const [bx, by, tx, ty, w] of [[x, top + h * 0.16, x - 22, top - 4, 3], [x + 1, top + h * 0.1, x + 20, top - 8, 3], [x - 1, top + h * 0.24, x - 8, top - 22, 2]]) {
    for (let k = 0; k <= 1; k += 0.012) {
      const px = lerp(bx, tx, k), py = lerp(by, ty, k) + Math.sin(k * Math.PI) * 2;
      const r = lerp(w, 0.7, k);
      for (let xx = Math.round(px - r); xx <= Math.round(px + r); xx++) p.px(xx, Math.round(py), xx < px ? bark[3] : bark[1]);
    }
  }
  // canopy: dark underside, mid clumps, a lit moon-side rim; the outside stays broken, not a ball
  foliage(p, x - 25, top + 8, 22, 13, C, 3, 8);
  foliage(p, x + 21, top + 14, 20, 12, C, 5, 7);
  foliage(p, x - 4, top + 1, 25, 14, C, 7, 9);
  for (let i = 0; i < 26; i++) {
    const a = rand(9, i, 1) * TAU, r = 9 + rand(9, i, 2) * 24;
    const px = x + Math.cos(a) * r, py = top + 8 + Math.sin(a) * r * 0.6;
    p.dot(px, py, i % 3 ? C[4] : C[5], 0.55);
  }
  for (let i = 0; i < 12; i++) {
    const px = x - 28 + rand(13, i, 1) * 12, py = top + 4 + rand(13, i, 2) * 6;
    p.dot(px, py, C[5], 0.7);
  }
}

function paving(p, y, C, seed) {
  // flat, mossy paving: the joints are darker than the stone, never a bright plank
  for (let row = 0; row < 2; row++) {
    for (let x = 60 + (row % 2) * 11; x < 262; x += 24) {
      const yy = y + 3 + row * 5, ww = 12 + Math.floor(rand(seed, row, x) * 9);
      if (rand(seed, row, x + 1) > 0.86) continue;
      const tone = mix(STONE[2], STONE[3], rand(seed, row, x + 2) * 0.6);
      p.rect(x, yy, ww, 2, tone);
      p.rect(x, yy, ww, 1, mix(tone, STONE[5], 0.35));
      p.rect(x, yy + 2, ww, 1, STONE[1]);
      if (rand(seed, row, x + 3) > 0.7) p.px(x + 3, yy + 1, mix(tone, C[4], 0.6));
    }
  }
}

function dais(p, x, y, C, seed) {
  // a cracked ritual dais under the arena: two low stone rings, moss in the seams, faint old runes
  p.ellipse(x, y, 58, 8.5, STONE[1]);
  p.ellipse(x, y - 1, 54, 7, STONE[2]);
  p.ellipse(x, y - 2, 47, 5.6, mix(STONE[2], STONE[3], 0.55));
  p.ellipse(x, y - 2, 38, 4.4, STONE[2]);
  for (let a = 0; a < TAU; a += 0.22) {
    const px = x + Math.cos(a) * 50, py = y - 1 + Math.sin(a) * 6;
    p.dot(px, py, a % 0.9 < 0.3 ? C[4] : STONE[4], 0.55);
  }
  for (let i = 0; i < 18; i++) {
    const a = rand(seed, i, 1) * TAU, r = 12 + rand(seed, i, 2) * 40;
    p.dot(x + Math.cos(a) * r, y - 2 + Math.sin(a) * r * 0.12, STONE[4], 0.5);
  }
  // the middle groove catches a little cold light
  p.ellipse(x, y - 3, 20, 2.4, mix(STONE[1], WATER[3], 0.3));
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1;
    p.dot(x + Math.cos(a) * 14, y - 3 + Math.sin(a) * 1.6, WATER[4], 0.35);
  }
  p.glow(x, y - 3, 26, WATER[4], 0.06);
}

function build(C, o) {
  const seed = o.seed ?? 1;
  const base = bake(W, H, (p) => {
    sky(p, W, H, SKY_TOP, SKY_LOW, { horizon: 128, steps: 7 });
    stars(p, W, H, seed, 120, 112, "#cfc8ff");
    moon(p, 252, 39, 16, hex("#e8ecd8"), hex("#9db8c0"), seed);
    p.glow(252, 39, 68, hex("#a8c4c8"), 0.07);
    farTrees(p, 128, seed + 31, "#0a1715");
    for (let i = 0; i < 9; i++) {
      const x = rand(seed, i, 41) * W;
      p.glow(x, 122, 26, C[3], 0.05);
    }
  });
  const mid = bake(W, H, (p) => {
    // a broken pointed arch at the left and a snapped pillar at the right; the centre stays open
    arch(p, 22, 150, 86, 92, STONE, { broken: true, seed: seed + 2 });
    pillar(p, 286, 150, 13, 58, STONE, { broken: true });
    p.rect(20, 148, 100, 3, STONE[1]);
    bigTree(p, 12, 150, 118, C);
    bigTree(p, 312, 150, 96, C);
    // a low stone altar at the arena's centre, with a dead brazier, so the dais has a reason to exist
    p.rect(144, 136, 32, 14, STONE[2]);
    p.rect(144, 136, 32, 1, STONE[4]);
    p.rect(146, 138, 28, 10, STONE[1]);
    p.rect(148, 140, 24, 6, STONE[2]);
    p.rect(150, 142, 20, 3, STONE[1]);
    p.rect(140, 134, 40, 2, STONE[2]);
    p.rect(140, 134, 40, 1, STONE[3]);
    p.rect(156, 130, 8, 4, STONE[1]);
    p.ellipse(160, 130, 5, 1.6, STONE[1]);
    p.dot(160, 129, WATER[4], 0.8); p.dot(159, 129, WATER[3], 0.6);
    p.glow(160, 130, 18, WATER[4], 0.14);
    vine(p, 148, 136, 18, C, 6); vine(p, 172, 136, 14, C, 8);
    vine(p, 38, 0, 42, C, 1); vine(p, 88, 0, 58, C, 3); vine(p, 268, 0, 34, C, 5); vine(p, 300, 0, 52, C, 7);
    // rubble at the foot of the arch
    for (let i = 0; i < 18; i++) {
      const x = 26 + rand(seed, i, 61) * 96, yy = 149 - rand(seed, i, 62) * 3;
      p.rect(x, yy, 1 + Math.floor(rand(seed, i, 63) * 4), 1 + Math.floor(rand(seed, i, 64) * 2), STONE[i % 3 ? 2 : 3]);
      if (i % 3 === 0) p.dot(x + 1, yy - 1, C[3], 0.7);
    }
    for (let i = 0; i < 8; i++) {
      const x = 272 + rand(seed, i, 65) * 30, yy = 149 - rand(seed, i, 66) * 2;
      p.rect(x, yy, 2, 1, STONE[3]);
    }
    // moss on the stone edges
    for (let i = 0; i < 30; i++) {
      const x = rand(seed, i, 71) * W, yy = 98 + rand(seed, i, 72) * 50;
      if (x > 20 && x < 116) p.dot(x, yy, C[3], 0.6);
      if (x > 276) p.dot(x, yy, C[3], 0.5);
    }
    p.glow(70, 120, 60, C[4], 0.06);
  });
  const floor = bake(W, H, (p) => {
    ground(p, W, 150, H, ["#141714", "#090c09", "#1b2118", "#262e1d", "#334226", "#4a5c30", "#6d8340"].map(hex), { grass: true, stone: false, seed });
    paving(p, 150, C, seed + 4);
    dais(p, 160, 157, C, seed + 5);
    // a puddle holding the moon, with a mossy lip
    p.ellipse(96, 157, 28, 5.6, WATER[1]);
    p.ellipse(96, 156.5, 24, 4.3, WATER[2]);
    p.ellipse(100, 156, 10, 2.2, WATER[3]);
    for (let x = 70; x < 123; x++) p.px(x, 152 + Math.round(Math.abs(Math.sin(x * 0.3)) * 0.6), WATER[4]);
    for (let i = 0; i < 12; i++) p.dot(84 + rand(seed, i, 81) * 24, 155 + rand(seed, i, 82) * 3, WATER[5], 0.7);
    p.glow(96, 155, 34, WATER[4], 0.14);
    // roots running out of the left tree, and mushrooms and ferns in the quiet corners
    for (const [x, y, len] of [[18, 150, 42], [24, 151, 28], [300, 151, 22]]) {
      for (let k = 0; k < len; k++) p.px(x + k, y + Math.round(Math.sin(k * 0.22) * 1.5), k < len * 0.5 ? hex("#2c2115") : hex("#3d3020"));
    }
    mushroom(p, 116, 149, 2.2, C); mushroom(p, 122, 150, 1.6, C);
    fern(p, 34, 150, 3.2, C, 2); fern(p, 280, 150, 3.6, C, 5); fern(p, 64, 150, 2.4, C, 8);
    tufts(p, W, 150, C, seed + 11, 38);
    // rubble, low enough not to hide feet
    for (let i = 0; i < 18; i++) p.px(108 + rand(seed, i, 91) * 110, 148 + Math.floor(rand(seed, i, 92) * 3), i % 3 ? STONE[2] : C[3]);
    pool(p, 252, 150, 32, WATER, 0.3);
  });
  const fore = bake(W, H, (p) => {
    // dark blades at the very bottom and a few leaves over the corners; never over the fight line
    for (let x = 0; x < W; x++) {
      const hh = 3 + rand(seed, x, 101) * 9 + Math.sin(x * 0.08) * 2;
      if (rand(seed, x, 102) > 0.42) {
        p.px(x, H - 1, C[1]);
        for (let k = 1; k < hh; k++) p.px(x + Math.round(k * 0.22), H - 1 - k, k > hh * 0.7 ? C[2] : C[1]);
      }
    }
    for (let i = 0; i < 10; i++) {
      const x = rand(seed, i, 111) * W, y = 160 + rand(seed, i, 112) * 10;
      p.rect(x, y, 2, 1, C[1]); p.px(x + 2, y, C[2]);
    }
  });
  return { base, mid, floor, fore };
}

export function create(o) {
  const C = fit(o.palette, 8), L = build(C, o);
  let t = 0;
  return {
    update(dt) {
      t += dt;
    },
    draw(p) {
      const tt = t % D;
      blit(p, L.base);
      blit(p, L.mid);
      mist(p, tt, D, { y0: 96, y1: 142, color: "#a8c8c0", seed: (o.seed ?? 1) + 5, bands: 3, alpha: 0.07 });
      blit(p, L.floor);
      // the moon's reflection shivers on the puddle
      const ph = (tt / D) * TAU;
      for (let i = 0; i < 5; i++) {
        const x = 86 + i * 5 + Math.sin(ph * 2 + i) * 2, y = 153 + Math.round(Math.sin(ph * 3 + i * 1.7) * 0.6);
        p.dot(x, y, WATER[5], 0.25 + 0.2 * Math.sin(ph * 2 + i * 1.3));
      }
      fireflies(p, tt, D, { count: 11, x0: 10, x1: 310, y0: 30, y1: 142, color: "#d8ff8a", seed: (o.seed ?? 1) + 3 });
      leaves(p, tt, D, { count: 9, color: "#8fb45a", back: "#cfe49a", seed: (o.seed ?? 1) + 7, y0: 20, y1: 116 });
      motes(p, tt, D, { count: 22, color: "#e8f0d0", seed: (o.seed ?? 1) + 9, y0: 28, y1: 140 });
      // low moon light on the far side of the floor
      p.glow(252, 146, 70, hex("#a8c8c8"), 0.1 + 0.02 * Math.sin(ph));
      p.glow(96, 154, 30, WATER[4], 0.14 + 0.03 * Math.sin(ph * 2));
      blit(p, L.fore);
    },
  };
}
