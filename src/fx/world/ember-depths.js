// A basalt arena over a lava channel. The heat lives at the edges and under the floor, so the fight line stays a
// quiet band of dark rock with a lit lip; the eye is pulled by the two falls and the cracks, not by the floor noise.
import { PAL, fit, hex, mix, clamp, lerp, rand, TAU } from "../../core/index.js";
import { bake, blit, ground, embers, motes, mist, mushroom } from "./_lib.js";

export const meta = {
  name: "Ember Depths",
  desc: "A basalt arena under a volcano: lava falls pour down both walls, a broken bridge smoulders in the dark, heat haze drifts over glowing fissures and ash falls.",
  tags: ["map", "volcano", "cavern", "lava", "fantasy", "arena", "loop"],
  kind: "map",
  size: [320, 180],
  origin: [0, 0],
  duration: 9,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.ember, seed: 1 },
};

export const map = {
  groundY: 150,
  bounds: [6, 314],
  walk: [[6, 314]],
  platforms: [],
  spawns: { hero: [52, 150], mobs: [[150, 150], [196, 150]], boss: [264, 150] },
  arena: { x0: 6, x1: 314, groundY: 150 },
};

const W = 320, H = 180, D = meta.duration;
const ROCK = ["#080709", "#0f0c0e", "#171217", "#221a1e", "#30242a", "#443038", "#5c4142", "#7a5a50"].map(hex);
const HOT = [hex("#2a0808"), hex("#6a140c"), hex("#b82c12"), hex("#f06018"), hex("#ff9a28"), hex("#ffd45a"), hex("#fff6c8")];

function stalactites(p, seed) {
  for (let x = -2; x < W + 2; x++) {
    const h = 8 + Math.max(0, Math.sin(x * 0.09 + seed) * 10) + rand(seed, x, 1) * 22;
    for (let y = 0; y < h; y++) {
      let c = y < h * 0.55 ? ROCK[1] : ROCK[2];
      if (y > h - 3) c = ROCK[3];
      p.px(x, y, c);
    }
    if (x % 13 === 0 && h > 20) {
      for (let y = h; y < h + 6; y++) p.px(x, y, ROCK[2]);
      p.px(x, h + 6, HOT[2]);
    }
  }
}

function lavaFall(p, x, top, bottom, seed) {
  const width = 5 + (seed % 3);
  for (let y = top; y < bottom; y++) {
    const u = (y - top) / (bottom - top), ww = width * (0.7 + u * 0.7);
    for (let xx = Math.round(x - ww / 2); xx <= Math.round(x + ww / 2); xx++) {
      const d = Math.abs(xx - x) / (ww / 2);
      const n = Math.sin(y * 0.35 + seed + xx * 0.8) * 0.5 + Math.sin(y * 0.11 + seed * 2) * 0.5;
      let c = HOT[2];
      if (d < 0.45 + n * 0.15) c = HOT[4];
      if (d < 0.22) c = HOT[5];
      if (n > 0.55 && d > 0.3) c = HOT[1];
      p.px(xx, y, c);
    }
    p.glow(x, y, 10, HOT[3], 0.1);
  }
  for (let i = 0; i < 10; i++) {
    const yy = top + rand(seed, i, 2) * (bottom - top);
    p.dot(x + (rand(seed, i, 3) - 0.5) * width * 2, yy, HOT[5], 0.8);
  }
}

function columns(p, seed) {
  for (const [x, w, h, lean] of [[8, 22, 118, -2], [46, 14, 86, 1], [252, 16, 98, 2], [286, 26, 126, -1]]) {
    const top = 150 - h;
    for (let y = top; y < 150; y++) {
      const u = (y - top) / h, off = Math.round(lean * u);
      for (let xx = x + off; xx < x + w + off; xx++) {
        let c = ROCK[3];
        if (xx < x + off + 2) c = ROCK[5];
        else if (xx > x + w + off - 3) c = ROCK[1];
        if ((xx * 3 + y) % 29 === 0) c = ROCK[2];
        p.px(xx, y, c);
      }
    }
    // the lava light catches the inner edge
    for (let y = top + 6; y < 150; y++) p.dot(x + w + Math.round(lean) - 2, y, HOT[3], 0.22 + 0.1 * Math.sin(y * 0.2 + seed));
    p.glow(x + w / 2, top + h * 0.7, 30, HOT[2], 0.06);
  }
}

function bridge(p, seed) {
  // a broken bridge across the back, sagging in the middle, its underside lit by the lava below
  const y = 104;
  for (let x = 68; x < 250; x++) {
    if (x > 150 && x < 178) continue; // the span has fallen away
    const u = (x - 68) / 182, sag = Math.sin(u * Math.PI) * 8;
    const yy = y + sag;
    p.rect(x, yy, 1, 4, ROCK[4]);
    p.px(x, yy, ROCK[6]);
    p.px(x, yy + 4, ROCK[2]);
    if ((x - 68) % 14 === 0) p.rect(x, yy + 4, 3, 5, ROCK[2]);
  }
  for (let i = 0; i < 6; i++) {
    const x = 154 + rand(seed, i, 1) * 22, yy = y + 14 + rand(seed, i, 2) * 10;
    p.rect(x, yy, 2 + rand(seed, i, 3) * 3, 1, ROCK[3]);
  }
}

function build(C, o) {
  const seed = o.seed ?? 1;
  const base = bake(W, H, (p) => {
    // a cave, not a sky: a warm dark gradient, a jagged ceiling, and the far lava lake as a low band
    for (let y = 0; y < H; y++) {
      const u = y / H, c = mix(hex("#050408"), hex("#1c0b0b"), clamp(u * 1.1));
      for (let x = 0; x < W; x++) p.px(x, y, c);
    }
    stalactites(p, seed);
    // the distant lake under the bridge
    for (let x = 0; x < W; x++) {
      const h = 118 + Math.round(Math.sin(x * 0.05 + seed) * 3);
      for (let y = h; y < 136; y++) {
        const u = (y - h) / 18;
        p.px(x, y, u < 0.18 ? HOT[5] : u < 0.5 ? mix(HOT[4], HOT[3], u) : mix(HOT[2], HOT[1], u));
      }
      if (x % 7 === 0) p.dot(x, h - 1, HOT[4], 0.5 + 0.3 * Math.sin(x * 0.3));
    }
    p.glow(160, 126, 190, HOT[3], 0.17);
    p.glow(160, 128, 100, HOT[4], 0.12);
    // far columns and ash
    for (let i = 0; i < 16; i++) {
      const x = rand(seed, i, 5) * W, w = 3 + rand(seed, i, 6) * 9, h = 10 + rand(seed, i, 7) * 40;
      for (let y = 136 - h; y < 136; y++) for (let xx = x; xx < x + w; xx++) p.px(xx, y, ROCK[1]);
    }
  });
  const mid = bake(W, H, (p) => {
    bridge(p, seed + 4);
    columns(p, seed + 2);
    lavaFall(p, 34, 64, 150, seed + 3);
    lavaFall(p, 288, 52, 150, seed + 9);
    // warm rims on the near rock and a few vents
    for (let i = 0; i < 9; i++) {
      const x = rand(seed, i, 11) * W, y = 120 + rand(seed, i, 12) * 28;
      p.dot(x, y, HOT[4], 0.7); p.glow(x, y, 8, HOT[3], 0.12);
    }
  });
  const floor = bake(W, H, (p) => {
    ground(p, W, 150, H, [ROCK[1], hex("#090709"), ROCK[2], ROCK[3], ROCK[4], HOT[2], HOT[3]], { grass: false, stone: true, lava: true, seed });
    // a central basalt apron, darker and smoother than the cracked floor around it
    p.ellipse(160, 156, 78, 7, ROCK[1]);
    p.ellipse(160, 155, 72, 5, ROCK[2]);
    for (let a = 0; a < TAU; a += 0.18) p.dot(160 + Math.cos(a) * 70, 155 + Math.sin(a) * 5, ROCK[3], 0.7);
    // long glowing fissures running in from the sides
    for (const [x0, y0, x1, y1] of [[42, 154, 96, 166], [278, 153, 224, 167], [106, 171, 128, 156], [214, 170, 192, 156]]) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) {
        const x = Math.round(lerp(x0, x1, i / n)), y = Math.round(lerp(y0, y1, i / n) + Math.sin(i * 0.7) * 1.2);
        p.px(x, y, HOT[4]);
        p.dot(x, y + 1, HOT[2], 0.7);
        p.glow(x, y, 4, HOT[3], 0.18);
      }
    }
    // lava pools at the very edges, with a bright lip
    for (const [cx, rx, ry] of [[4, 26, 8], [316, 28, 9]]) {
      p.ellipse(cx, 157, rx, ry, HOT[2]);
      p.ellipse(cx, 156, rx * 0.8, ry * 0.7, HOT[4]);
      for (let i = 0; i < 12; i++) p.dot(cx + (rand(seed, i, 21) - 0.5) * rx * 1.4, 154 + rand(seed, i, 22) * 6, HOT[5], 0.6);
      p.glow(cx, 155, 50, HOT[3], 0.25);
    }
    // loose basalt shards and a couple of heat-loving mushrooms
    for (let i = 0; i < 26; i++) {
      const x = 12 + rand(seed, i, 31) * 296, y = 148 + Math.floor(rand(seed, i, 32) * 4);
      p.rect(x, y, 1 + rand(seed, i, 33) * 3, 1, i % 3 ? ROCK[2] : HOT[2]);
    }
    mushroom(p, 66, 149, 1.8, [ROCK[0], ROCK[1], ROCK[2], ROCK[3], ROCK[4], HOT[2], HOT[4], HOT[5]]);
  });
  const fore = bake(W, H, (p) => {
    // dark cave mouths and rock teeth at the bottom corners, far from the fight line
    for (const [x0, dir] of [[0, 1], [320, -1]]) {
      for (let i = 0; i < 46; i++) {
        const x = x0 + dir * i, h = 2 + rand(seed, i, 41) * (i < 18 ? 12 : 6);
        for (let k = 0; k < h; k++) p.px(x, H - 1 - k, k > h * 0.6 ? ROCK[1] : ROCK[0]);
      }
    }
  });
  return { base, mid, floor, fore };
}

export function create(o) {
  const C = fit(o.palette, 7), L = build(C, o);
  let t = 0;
  return {
    update(dt) {
      t += dt;
    },
    draw(p) {
      const tt = t % D, ph = (tt / D) * TAU;
      blit(p, L.base);
      mist(p, tt, D, { y0: 78, y1: 138, color: "#e08a58", seed: (o.seed ?? 1) + 8, bands: 2, alpha: 0.055 });
      blit(p, L.mid);
      // the falls shimmer and fling drops free at the bottom
      for (let i = 0; i < 8; i++) {
        const x = i < 4 ? 34 : 288, y = 70 + ((tt * 40 + i * 17) % 78), j = Math.sin(tt * 9 + i) * 2;
        p.dot(x + j, y, HOT[5], 0.6);
        if (i % 2) p.glow(x + j, y, 5, HOT[3], 0.16);
      }
      blit(p, L.floor);
      // the lava breathes; the fissures pulse with it
      p.glow(34, 148, 34, HOT[3], 0.15 + 0.04 * Math.sin(ph * 3));
      p.glow(288, 148, 36, HOT[3], 0.15 + 0.04 * Math.sin(ph * 3 + 1.2));
      p.glow(160, 152, 60, HOT[2], 0.06 + 0.02 * Math.sin(ph * 2));
      embers(p, tt, D, { count: 22, color: "#ff9a3c", seed: (o.seed ?? 1) + 3, y0: 150, y1: 48 });
      motes(p, tt, D, { count: 18, color: "#ffdca8", seed: (o.seed ?? 1) + 7, y0: 24, y1: 144 });
      blit(p, L.fore);
    },
  };
}
