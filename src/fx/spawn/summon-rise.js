import { PAL, RAMP, ramp, at, burst, fly, seg, ease, bump, rand, TAU, WHITE, hex } from "../../core/index.js";
import { smoke, onCanvas } from "./_lib.js";

export const meta = {
  name: "Summon rise",
  desc: "A rune circle smoulders on the floor, the ground splits, and a hunched horned shape heaves up out of it in a burst of dust, eyes flaring, before it fades.",
  tags: ["spawn", "summon", "demon", "rise", "dust", "ground", "one-shot"],
  size: [80, 60],
  origin: [40, 52],
  duration: 2.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.lava, seed: 32 },
};

// a hunched, horned brute: x is body, e the eyes; the rim light is worked out from the shape
const BEAST = [
  "x....................x",
  "xx..................xx",
  ".xx................xx.",
  "..xx....xxxxxx....xx..",
  "...xx..xxxxxxxx..xx...",
  "....xxxxxxxxxxxxxx....",
  ".....xxxexxxxexxx.....",
  "....xxxxxxxxxxxxxx....",
  "...xxxxxxxxxxxxxxxx...",
  "..xxxxxxxxxxxxxxxxxx..",
  ".xxxxxxxxxxxxxxxxxxxx.",
  ".xxx.xxxxxxxxxxxx.xxx.",
  "xxx..xxxxxxxxxxxx..xxx",
  "xx...xxxxxxxxxxxx...xx",
  "x.x..xxxxxxxxxxxx..x.x",
  ".....xxxxxxxxxxxx.....",
  ".....xxxxx..xxxxx.....",
  ".....xxxx....xxxx.....",
  "....xxxx......xxxx....",
  "...xxxxx......xxxxx...",
];
const W = BEAST[0].length, H = BEAST.length;
const BODY = hex("#2a1626");
const RISE = [0.3, 0.95], FADE = [1.55, 1.95];

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, D = RAMP.dust, inside = onCanvas(meta, 2);
  // the rune circle: a ring and spokes scorched into the floor, smouldering, then cooling
  const rune = seg(t, 0, 0.25) * (1 - seg(t, 1.5, 2.0)), hot = 0.6 + 0.4 * Math.sin(t * 20) * (1 - seg(t, 0.3, 1));
  if (rune > 0) {
    p.ellipse(0, 1, 22 * rune, 4 * rune, (d) => (d > 0.82 ? at(C, 0.4 + 0.35 * hot) : at(C, 0.12)), (d) => (d > 0.82 ? 1 : d > 0.7 ? 0 : 0.35 * rune));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3, L = 20 * rune * (0.6 + 0.4 * rand(S, i));
      p.line(0, 1, Math.cos(a) * L, 1 + Math.sin(a) * L * 0.18, at(C, 0.3 + 0.3 * hot));
    }
    p.glow(0, 0, 26, at(C, 0.55), 0.35 * rune * hot);
  }
  // the beast heaves up out of the floor, shaking, only what's above the floor showing
  const up = ease.outCubic(seg(t, RISE[0], RISE[1])), fade = 1 - seg(t, FADE[0], FADE[1]);
  const shake = up > 0 && up < 1 ? Math.round(Math.sin(t * 70) * 1) : 0;
  const top = Math.round(-up * H + (1 - up) * 2), x0 = -W / 2 + shake;
  if (up > 0 && fade > 0)
    for (let j = 0; j < H; j++) {
      const y = top + j;
      if (y >= 0) break;
      for (let i = 0; i < W; i++) {
        const ch = BEAST[j][i];
        if (ch === ".") continue;
        // lit by the rune from below and by its glow along the top-left edges; shadowed on the right
        const lit = i === 0 || BEAST[j][i - 1] === "." || j === 0 || BEAST[j - 1][i] === ".";
        const dark = i === W - 1 || BEAST[j][i + 1] === ".";
        let c = lit ? at(C, 0.42) : dark ? at(C, 0.12) : y > -4 && rune > 0.3 ? at(C, 0.2) : BODY;
        if (ch === "e") c = t > 0.85 ? (bump(t, 0.85, 1.25) > 0.6 ? WHITE : at(C, 0.92)) : at(C, 0.5);
        p.dot(x0 + i, y, c, fade);
      }
    }
  // the eyes: they flare once it's up, and stay lit
  if (t > 0.85 && fade > 0) {
    const ey = top + 6, k = (0.4 + 0.6 * bump(t, 0.85, 1.3)) * fade;
    p.glow(x0 + 8.5, ey, 6, at(C, 0.8), 0.6 * k), p.glow(x0 + 13.5, ey, 6, at(C, 0.8), 0.6 * k);
  }
  // dust: billows thrown out along the floor as it breaks through, rising and thinning
  const dust = [];
  burst(12, S + 1, (r, i) => {
    const age = t - RISE[0] - r.range(0, 0.25), life = r.range(0.7, 1.1);
    if (age < 0 || age > life) return;
    const q = age / life, side = i % 2 ? 1 : -1, e = ease.outCubic(seg(age, 0, 0.5));
    dust.push({ x: side * (8 + r.range(2, 22) * e), y: -2 - r.range(0, 6) * e - q * r.range(4, 10), r: r.range(3, 5.5) * (0.5 + 0.6 * e), v: (1 - q) ** 1.2 });
  });
  smoke(p, dust, [D[2], D[3], D[4], D[5], D[6]], { base: 0.3, seed: S, inside: (x, y) => y < 1 });
  // rubble: chunks of floor flung up and falling back
  burst(10, S + 2, (r) => {
    const age = t - RISE[0] - r.range(0, 0.1), life = 0.7;
    if (age < 0 || age > life) return;
    const a = -Math.PI / 2 + r.range(-1.2, 1.2), v = r.range(60, 120), [x, y] = fly(r.range(-10, 10), -1, Math.cos(a) * v, Math.sin(a) * v, age, 320, 0.4);
    if (y > -1 || !inside(x, y)) return;
    p.rect(x, y, r.chance(0.5) ? 2 : 1, r.chance(0.5) ? 2 : 1, r.chance(0.5) ? D[2] : D[3]);
  });
}
