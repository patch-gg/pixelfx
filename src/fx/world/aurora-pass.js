// A frozen mountain pass at night: eroded snow massifs, wind-packed drifts and snow-laden conifers under a moving
// aurora. The combat shelf stays level and quiet while the sky, the crests and the forest edges carry the detail.
import { fit, hex, mix, rand, noise2, TAU } from "../../core/index.js";
import { bake, blit, sky, stars, moon } from "./_lib.js";
import { conifer, massif, rock } from "./_nature.js";

export const meta = {
  name: "Aurora Pass",
  desc: "A frozen mountain pass beneath green aurora curtains: snow-bound massifs catch the sky, frosted conifers climb the shoulders and wind lifts loose snow across a quiet shelf.",
  tags: ["map", "snow", "ice", "aurora", "mountain", "fantasy", "arena", "loop"],
  kind: "map", size: [320, 180], origin: [0, 0], duration: 12, loop: true, fps: 30, bg: "dark",
  options: { palette: ["#070e20", "#101e35", "#1b304a", "#2b4b65", "#466e87", "#709eaf", "#a6cbd3", "#e0eeea"], seed: 1 },
};

export const map = {
  groundY: 150, bounds: [8, 312], walk: [[8, 312]], platforms: [],
  spawns: { hero: [54, 150], mobs: [[148, 150], [198, 150]], boss: [264, 150] },
  arena: { x0: 8, x1: 312, groundY: 150 },
};

const W = 320, H = 180, D = meta.duration;
const GREEN = hex("#68dcb9"), VIOLET = hex("#8178c4"), TEAL = mix(GREEN, VIOLET, 0.5);

// The palette is only eight steps wide, so each depth plane gets its own short ramp instead of one global one.

function ramps(C) {
  const haze = (c, k) => mix(c, mix(C[2], C[4], 0.45), k);
  return {
    far: [haze(C[1], 0.45), haze(C[2], 0.5), haze(C[3], 0.45), haze(C[3], 0.3), haze(C[4], 0.25), haze(C[5], 0.2), haze(C[6], 0.15)],
    mid: [C[1], C[2], C[3], C[4], C[5], C[6], C[7]],
    near: [C[0], C[0], C[1], C[2], C[3], C[4], C[5]],
    pine: [C[0], C[0], C[1], C[2], C[5], C[7]],
  };
}

function build(C, seed) {
  const R = ramps(C);
  const skyLayer = bake(W, H, (p) => {
    sky(p, W, H, C[0], mix(C[2], C[4], 0.55), { horizon: 150 });
    // A cold airglow settles where the aurora meets the horizon.
    for (let y = 72; y < 132; y++) {
      const a = Math.max(0, (y - 72) / 60) * 0.1;
      for (let x = 0; x < W; x += 2) p.blend(x, y, mix(C[3], GREEN, 0.35), a);
    }
    stars(p, W, H, seed, 96, 98, "#c9d9ea");
  });
  const back = bake(W, H, (p) => {
    moon(p, 266, 26, 8, C[6], C[4], seed);
    // The far range is hazed into the sky and carries almost no internal detail.
    massif(p, [[-18, 110, 66], [48, 92, 76], [120, 106, 66], [196, 90, 76], [268, 104, 66], [334, 92, 66]],
      150, R.far, { seed: seed + 31, snowline: 104, detail: false });
    // Two massifs frame a central pass; their valleys leave a gap for the distant range and the aurora.
    massif(p, [[52, 66, 92], [112, 90, 66]], 150, R.mid, { seed: seed + 3, snowline: 96 });
    massif(p, [[214, 90, 66], [258, 64, 92]], 150, R.mid, { seed: seed + 9, snowline: 96 });
    // A scatter of small conifers along the apron gives the range its scale.
    const farPine = [C[0], mix(C[0], C[2], 0.5), C[2], C[3], C[4], C[5]];
    for (let i = 0; i < 11; i++) {
      const cluster = 68 + (i % 4) * 54 + rand(seed, i, 40) * 34;
      const x = cluster + (rand(seed, i, 41) - 0.5) * 16, y = 142 + rand(seed, i, 42) * 7;
      const h = 6 + rand(seed, i, 43) * 11;
      conifer(p, x, y, h, 3 + rand(seed, i, 44) * 3.2, farPine, { seed: seed + i * 9, detail: false });
      p.px(x, y - h + 1, C[5]);
    }
    // Near shoulders sit in front, darker and steeper, with the treeline on their crests.
    const left = massif(p, [[-30, 96, 80], [20, 108, 44], [56, 148, 22]], 152, R.near, { seed: seed + 17, snowline: 100 });
    const right = massif(p, [[350, 94, 82], [300, 106, 46], [264, 148, 22]], 152, R.near, { seed: seed + 23, snowline: 100 });
    for (const [at, x0, x1] of [[left, 14, 45], [right, 274, 306]]) {
      for (let i = 0, x = x0; x <= x1; i++, x += 5 + Math.floor(rand(seed, i, x) * 5)) {
        const base = at(x) + 2, h = 18 + rand(seed, x, 1) * 20;
        conifer(p, x, base, h, h * 0.42, R.pine, { seed: seed + x, lean: (rand(seed, x, 2) - 0.5) * 3 });
      }
    }
    // Two tall conifers rise from the shelf itself, framing the fight without entering it.
    conifer(p, 18, 150, 62, 26, R.pine, { seed: seed + 101, lean: 3 });
    conifer(p, 38, 150, 44, 19, R.pine, { seed: seed + 103, lean: -3 });
    conifer(p, 302, 150, 68, 29, R.pine, { seed: seed + 107, lean: -3 });
    conifer(p, 282, 150, 40, 17, R.pine, { seed: seed + 109, lean: 2 });
    // Snow banks and boulders anchor the treeline to the shelf.
    const stone = [C[0], C[0], C[1], C[2], C[3]];
    for (const [i, x] of [14, 27, 42, 278, 294, 306].entries()) rock(p, x, 149, 7 + rand(seed, i, 3) * 4, 4 + rand(seed, i, 4) * 2, stone, { seed: seed + i * 13 });
  });
  const floor = bake(W, H, (p) => {
    // The shelf: a bright continuous rim, then packed snow that darkens into the drop below.
    for (let x = 0; x < W; x++) {
      const n = noise2(x * 0.13, 0.4, seed) * 0.5 + noise2(x * 0.37, 2.1, seed) * 0.3;
      p.px(x, 150, C[7]);
      p.px(x, 151, n > 0.2 ? C[6] : C[7]);
      p.px(x, 152, n < -0.3 ? C[4] : C[5]);
      p.px(x, 153, C[4]);
      p.px(x, 154, n > 0.35 ? C[4] : C[3]);
      p.px(x, 155, C[3]);
      p.px(x, 156, n < -0.2 ? C[2] : C[3]);
    }
    // Wind-polished streaks sit below the feet, not under them.
    for (let i = 0; i < 46; i++) {
      const x = 6 + rand(seed, i, 5) * 308, y = 152 + Math.floor(rand(seed, i, 6) * 4);
      const len = 3 + Math.floor(rand(seed, i, 7) * 9);
      p.line(x, y, x + len, y, i % 3 ? C[5] : C[6], 0.8);
    }
    for (let i = 0; i < 12; i++) {
      const x = rand(seed, i, 8) * W, y = 155 + rand(seed, i, 9) * 3;
      p.line(x, y, x + 4 + rand(seed, i, 10) * 6, y + (i % 2), C[2], 0.7);
    }
    // Embedded stones and chips of ice at the shelf edges.
    for (let i = 0; i < 14; i++) {
      const x = i < 7 ? 4 + rand(seed, i, 11) * 44 : 272 + rand(seed, i, 12) * 44;
      const y = 151 + Math.floor(rand(seed, i, 13) * 3);
      p.rect(x, y, 2 + Math.floor(rand(seed, i, 14) * 3), 1, C[3]);
      p.px(x, y + 1, C[2]);
      p.px(x, y - 1, C[6]);
    }
    // The front face is a shadowed slope below the cornice: quiet under the fighters, carved at the edges.
    for (let y = 157; y < H; y++) {
      const d = (y - 157) / (H - 157), base = mix(C[2], C[0], Math.min(1, d * 1.15));
      for (let x = 0; x < W; x++) {
        const e = Math.min(x, W - 1 - x);
        const n = noise2(x * 0.06, y * 0.05, seed + 5);
        let c = base;
        if (n > 0.32) c = mix(base, C[3], 0.22);
        if (n < -0.45) c = mix(base, C[0], 0.5);
        // Snow streaks run down the slope, thinning as they fall.
        if (e < 46 && d < 0.75 && (x * 7 + seed) % 13 < 2) c = mix(C[4], C[3], d);
        if (e < 20 && d > 0.25 && d < 0.7 && noise2(x * 0.3, y * 0.2, seed) > 0.1) c = C[3];
        p.px(x, y, c);
      }
    }
    // The cornice hangs a little proud of the slope, with a scalloped underside.
    for (let x = 0; x < W; x++) {
      const reach = 2 + Math.round((noise2(x * 0.16, 4.4, seed) * 0.5 + 0.5) * 4);
      for (let y = 157; y < 157 + reach; y++) p.px(x, y, y === 157 + reach - 1 ? C[1] : C[2]);
    }
    // A few shallow snow ledges and icicles stay at the edges.
    for (const [x, y, w] of [[9, 160, 15], [35, 164, 11], [288, 164, 12], [309, 159, 13]]) {
      p.ellipse(x, y, w * 0.5, 1.8, C[3]);
      p.line(x - w * 0.3, y - 1, x + w * 0.25, y - 1, C[4]);
    }
    for (let i = 0; i < 10; i++) {
      const x = i < 5 ? 6 + rand(seed, i, 25) * 34 : 282 + rand(seed, i, 26) * 32;
      const len = 2 + Math.floor(rand(seed, i, 27) * 4);
      for (let k = 0; k < len; k++) p.px(x, 160 + k, k === len - 1 ? C[5] : C[4]);
    }
    // A low snow bank at each edge, outside the walkable span.
    for (const [a, b] of [[0, 7], [313, 319]]) {
      for (let x = a; x <= b; x++) for (let y = 147 + (x % 2); y < 150; y++) p.px(x, y, y === 147 ? C[6] : C[5]);
    }
  });
  return { skyLayer, back, floor };
}

export function create(o) {
  const C = fit(o.palette, 8), seed = o.seed ?? 1, L = build(C, seed);
  let t = 0;
  return {
    update(dt) { t += dt; },
    draw(p) {
      const u = (t % D) / D, ph = u * TAU;
      blit(p, L.skyLayer);
      aurora(p, ph);
      blit(p, L.back);
      // Loose snow skims across the shelf, thinning at the edges of its run.
      for (let i = 0; i < 10; i++) {
        const q = (u * 3 + i / 10) % 1, x = Math.max(0, -10 + q * 340), y = 140 + (i % 3) * 3;
        const a = Math.sin(q * Math.PI) * 0.26, end = Math.min(W - 1, x + 9 + (i % 4) * 3);
        if (end > x) p.line(x, y, end, y + (i % 2), C[6], a);
      }
      blit(p, L.floor);
      // The aurora leaves a faint green sheen on the shelf and on the packed snow below it.
      for (let i = 0; i < 11; i++) {
        const x = 52 + i * 20 + Math.sin(ph * 2 + i) * 5;
        const a = 0.07 + 0.06 * Math.sin(ph * 2 + i * 1.7);
        p.line(x, 151 + (i % 2), x + 9, 151 + (i % 2), GREEN, a);
        p.light(x + 4, 150, GREEN, 0.02 + 0.02 * Math.sin(ph * 2 + i));
      }
      snow(p, u, ph, seed, C);
    },
  };
}

/** Two aurora curtains: tall sheets of vertical filaments over a bright green lower fringe. */
function aurora(p, ph) {
  for (let layer = 0; layer < 2; layer++) {
    const off = layer * 0.43, k = layer ? 0.55 : 1, base = -26 + layer * 12;
    for (let x = 0; x < W; x++) {
      const fold = Math.sin(x * 0.016 + ph + layer * 1.7) * 10 + Math.sin(x * 0.041 - ph * 2 + layer) * 5 + Math.sin(x * 0.1 + ph * 3) * 2;
      const ray = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(x * 0.045 + ph * 2 + off), 2);
      const fine = 0.4 + 0.6 * Math.sin(x * 0.37 + Math.sin(x * 0.071) * 6 + ph * 6) ** 2;
      const len = ((layer ? 54 : 76) + Math.sin(x * 0.031 + ph * 2 + off) * 16 + Math.sin(x * 0.083 - ph * 3) * 8) * (0.7 + ray * 0.5);
      const bottom = base + 18 + fold + len, top = bottom - len;
      const env = Math.sin(Math.max(0, Math.min(1, (x + 14) / (W + 28))) * Math.PI);
      const breathe = 0.65 + 0.35 * Math.sin(x * 0.07 + ph * 2);
      for (let y = Math.max(0, Math.floor(top)); y < Math.min(H, Math.ceil(bottom)); y++) {
        const v = (y - top) / len;
        if (v < 0 || v > 1) continue;
        let a = (0.03 + v * 0.3) * ray * env * k * breathe * fine;
        if (v > 0.86) a += (v - 0.86) * 5.2 * ray * env * k * fine;
        if (a < 0.02) continue;
        p.blend(x, y, v > 0.68 ? GREEN : v > 0.3 ? TEAL : VIOLET, a);
      }
      p.light(x, Math.round(bottom - 3), GREEN, env * ray * k * fine * 0.12);
    }
  }
}

/** Drifting snow in three depths; the near flakes are two pixels and catch a little light. */
function snow(p, u, ph, seed, C) {
  for (let i = 0; i < 68; i++) {
    const depth = i % 3;
    const q = (u * (1 + depth * 0.45) + rand(seed, i, 20)) % 1;
    const x = 2 + rand(seed, i, 21) * 316 + Math.sin(ph * 2 + i) * (3 + depth * 2);
    const y = -2 + q * 150;
    const a = Math.sin(q * Math.PI) * (depth === 2 ? 0.85 : 0.55);
    if (x < 0 || x >= W || y < 0) continue;
    p.dot(x, y, depth === 2 ? C[7] : C[6], a);
    if (depth === 2) {
      if (x + 1 < W) p.dot(x + 1, y + 1, C[6], a * 0.45);
      p.light(x, y, C[7], 0.03);
    }
  }
}
