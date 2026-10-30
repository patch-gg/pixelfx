import { PAL, ramp, at, burst, cycle, fly, flyV, seg, ease, clamp, rng, rand, bolt, TAU, WHITE } from "../../core/index.js";
import { steps, zap, glowPath, part, crackle, branches, crumble, fence } from "./_lib.js";

export const meta = {
  name: "Lightning strike",
  desc: "A bolt cracks down from the sky: a faint leader, a white return stroke with branches, a re-strike, sparks skipping off a smouldering scorch.",
  tags: ["lightning", "electric", "storm", "impact", "ground", "one-shot"],
  size: [80, 120],
  origin: [40, 110],
  duration: 1,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.electric, height: 104, seed: 7 },
};

const CHAR = ramp(["#0c090c", "#191215", "#2a1d1c"]);
const EMBER = ramp(["#5a1a10", "#a83a18", "#e8782a", "#ffc870"]);
const SMOKE = ramp(["#2a2734", "#3b3747", "#4d485a"]);

// stroke brightness over time: leader, hero return stroke, a dark beat, the re-strike, then decay
function stroke(t) {
  if (t < 0.066) return 0;
  if (t < 0.1) return 1;
  if (t < 0.133) return 0.8;
  if (t < 0.166) return 0.3;
  if (t < 0.233) return 0.9;
  return 0.5;
}

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, H = o.height;
  const main = bolt(rng(S, 1), rand(S, 2) * 12 - 6, -H, 0, 0, { jag: 0.2, depth: 5 });
  const I = stroke(t);

  // the stepped leader: a dim, forked tip feeling its way down before the stroke
  if (t < 0.066) {
    const u = ease.inQuad(seg(t, 0, 0.066)) * 0.8 + 0.2, lead = part(main, u);
    zap(p, lead, C[4], null, 0.85);
    for (const f of branches(rng(S, 3), lead, { count: 3, len: 12, from: 0.3, to: 0.95 })) p.polyline(f, C[3], 0.7);
    const [tx, ty] = lead[lead.length - 1];
    p.px(tx, ty, WHITE);
    glowPath(p, lead, 8, C[4], 0.25);
    p.glow(main[0][0], -H, 44, C[3], 0.3);
  }

  // the channel: hero stroke white with a halo, the re-strike takes the same channel with new branches,
  // then the spent channel crumbles away segment by segment
  if (t >= 0.066 && t < 0.233) {
    const hero = I > 0.95, bright = I > 0.75;
    const core = hero ? WHITE : bright ? C[6] : C[4];
    const edge = hero ? C[5] : bright ? C[4] : null;
    const set = t < 0.166 ? 4 : 5; // a new set of branches for the re-strike
    if (I > 0.25) {
      const br = branches(rng(S, set), main, { count: bright ? 6 : 3, len: 30, jag: 0.3, spread: 0.85, from: 0.08, to: 0.75, side: set === 4 ? 1 : -1 });
      br.forEach((f, i) => {
        p.polyline(fence(f, -38, 38, -118, -2), hero ? C[5] : C[4]);
        if (bright && i < 4) for (const g of branches(rng(S, set, i), f, { count: 1, len: 12, jag: 0.35, from: 0.3, to: 0.7 })) p.polyline(fence(g, -38, 38, -118, -2), C[3]);
      });
    }
    zap(p, main, core, edge);
    glowPath(p, main, 12, C[4], 0.45 * I * I);
  } else if (t >= 0.233) {
    const u = seg(t, 0.233, 0.43);
    if (u < 1) {
      crumble(p, main, u, S + 6, u < 0.35 ? C[5] : C[4]);
      glowPath(p, main, 8, C[3], 0.25 * (1 - u));
    }
  }

  // the whole sky goes white for the hero frame, then the light drops away fast
  if (t >= 0.066) {
    const flash = Math.max(t < 0.1 ? 1 : 0, t >= 0.166 && t < 0.2 ? 0.7 : 0, 0.45 * (1 - seg(t, 0.066, 0.45)));
    p.glow(0, -H * 0.55, 90, C[4], 0.35 * flash);
    p.glow(0, -2, 26, C[5], 0.5 * flash);
  }

  // impact: a white burst on the floor, crackles running out along it
  if (t >= 0.066 && t < 0.2) {
    const k = seg(t, 0.066, 0.2);
    p.ellipse(0, 0, 10 - 5 * k, 3 - k, k < 0.3 ? WHITE : C[5], (d) => (d < 0.6 ? 1 : 1 - k));
    p.circle(0, -1, 3.5 - 2 * k, WHITE);
  }
  if (t >= 0.066 && t < 0.36) {
    const fi = Math.floor(t * 15), k = seg(t, 0.066, 0.36);
    burst(4, S + 20, (r, i) => {
      const side = i % 2 ? 1 : -1, reach = r.range(9, 22) * (1 - 0.45 * k);
      const pts = crackle(rng(S, 21, i, fi), side * 2, -1, side * reach, r.range(-3, -1), 0.35);
      p.polyline(pts, k < 0.4 ? C[5] : C[4]);
    });
  }

  // scorch: a black burn on the floor, its glowing cracks cooling, smoke curling up off it
  if (t >= 0.08) {
    const k = seg(t, 0.08, 0.97), fade = 1 - ease.inQuad(k);
    p.ellipse(0, 1, 13, 2.2, (d) => (d < 0.5 ? CHAR[0] : d < 0.8 ? CHAR[1] : CHAR[2]), (d) => (d > 0.8 ? 0.6 : 1) * fade);
    const heat = 1 - seg(t, 0.1, 0.75);
    burst(7, S + 30, (r) => {
      const x = Math.round(r.range(-10, 10)), y = r.chance(0.5) ? 1 : 0, w = r.int(1, 3), hk = heat * (1.1 - Math.abs(x) / 14);
      if (hk <= 0.05) return;
      p.rect(x, y, w, 1, at(EMBER, hk));
    });
    p.ellipse(0, 0, 3.5 * heat + 1, 1, EMBER[3], heat > 0.35 ? 1 : 0);
    p.glow(0, 0, 16, EMBER[2], 0.35 * heat * heat);
    burst(4, S + 31, (r, i) => {
      const age = t - 0.16 - i * 0.07 - r.range(0, 0.04), life = r.range(0.45, 0.6);
      if (age < 0 || age > life) return;
      const q = age / life, x = r.range(-7, 7) + Math.sin(age * 6 + r.next() * TAU) * 1.5, y = -1.5 - age * r.range(16, 24);
      p.circle(x, y, 1.2 + q * 1.8, at(SMOKE, 1 - q * 0.9), 1 - seg(q, 0.6, 1));
    });
  }

  // sparks: thrown up off the strike, falling, skipping once off the floor, cooling
  burst(13, S + 9, (r) => {
    const born = 0.07 + r.range(0, 0.05), age = t - born, life = r.range(0.3, 0.55);
    if (age < 0 || age > life) return;
    const a = -Math.PI / 2 + r.range(-1.1, 1.1), sp = r.range(50, 100);
    const vx0 = Math.cos(a) * sp, vy0 = Math.sin(a) * sp;
    let [x, y] = fly(0, -2, vx0, vy0, age, 320, 1.8);
    let [vx, vy] = flyV(vx0, vy0, age, 320, 1.8);
    if (y > 0) (y = -y * 0.3), (vy = -vy * 0.3);
    const q = age / life;
    p.line(x, y, x - vx * 0.035, y - vy * 0.035, q < 0.3 ? WHITE : q < 0.65 ? C[5] : C[3]);
    p.light(x, y, C[4], 0.5 * (1 - q));
  });
}
