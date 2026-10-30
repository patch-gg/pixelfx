import { PAL, ramp, at, rng, burst, fly, seg, luma, TAU, WHITE } from "../../core/index.js";
import { actorOf, actorPixels, steps } from "./_lib.js";

export const meta = {
  name: "Shatter death",
  desc: "Frozen solid from the feet up, cracks race across the ice statue, then it bursts into tumbling shards that bounce across the floor and melt away.",
  tags: ["spawn", "death", "ice", "freeze", "shatter", "one-shot"],
  size: [84, 48],
  origin: [42, 44],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: false,
  options: { palette: PAL.ice, shards: 11, seed: 27 },
};

const FREEZE = [0.06, 0.3], CRACK = 0.32, BREAK = 0.52, G = 340, E = 0.3;
const memo = new WeakMap();

/** Cut the silhouette into shards: every pixel goes to its nearest seed point. */
function shardsOf(actor, n, seed, C) {
  const key = `${n}:${seed}`;
  let byMask = memo.get(actor.mask);
  if (!byMask) memo.set(actor.mask, (byMask = new Map()));
  if (byMask.has(key)) return byMask.get(key);
  const px = actorPixels(actor, C), r = rng(seed, 7), seeds = [];
  for (let i = 0; i < n; i++) seeds.push(px[Math.floor(r.next() * px.length)]);
  const shards = seeds.map(() => ({ px: [], cx: 0, cy: 0 })), owner = new Map();
  for (const q of px) {
    let best = 0, bd = Infinity;
    seeds.forEach((s, i) => {
      const d = (q.x - s.x) ** 2 + ((q.y - s.y) * 0.8) ** 2;
      if (d < bd) (bd = d), (best = i);
    });
    shards[best].px.push({ ...q });
    owner.set(`${q.x},${q.y}`, best);
  }
  for (const s of shards) {
    s.cx = s.px.reduce((a, q) => a + q.x + 0.5, 0) / (s.px.length || 1);
    s.cy = s.px.reduce((a, q) => a + q.y + 0.5, 0) / (s.px.length || 1);
    s.grid = new Map(s.px.map((q) => [`${q.x},${q.y}`, q]));
    s.R = Math.max(...s.px.map((q) => Math.hypot(q.x + 0.5 - s.cx, q.y + 0.5 - s.cy))) + 1;
  }
  // pixels on a border between two shards are where the cracks run
  shards.forEach((s, me) => {
    for (const q of s.px)
      q.crack = [[1, 0], [0, 1]].some(([dx, dy]) => {
        const o = owner.get(`${q.x + dx},${q.y + dy}`);
        return o !== undefined && o !== me;
      });
  });
  const out = shards.filter((s) => s.px.length);
  byMask.set(key, out);
  return out;
}

/** A shard's flight: launched, falling, bouncing once or twice, then sliding to rest. Returns [x, y, angle]. */
function tumble(t, s, r) {
  const dir = Math.sign(s.cx || r.sign()), vx = dir * r.range(12, 34) + s.cx * 2.5, spin = r.range(-7, 7);
  let x = s.cx, y = s.cy, v = -r.range(40, 90) - (s.cy + 19) * 1.5, bx = vx, tt = t, ang = 0, w = spin;
  const floor = -s.R * 0.6;
  for (let n = 0; n < 3; n++) {
    const T = (-v + Math.sqrt(v * v + 2 * G * (floor - y))) / G;
    if (tt < T) return [x + bx * tt, y + v * tt + 0.5 * G * tt * tt, ang + w * tt];
    (tt -= T), (x += bx * T), (y = floor), (ang += w * T), (v = -(v + G * T) * E), (bx *= 0.5), (w *= 0.4);
  }
  const slide = 1 - Math.exp(-tt * 6);
  return [x + (bx / 6) * slide, floor, ang + (w / 6) * slide];
}

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 8), S = o.seed, actor = actorOf(o), top = actor.y, H = actor.h;
  const ice = (q) => at(C, 0.3 + luma(q.c) * 0.75);
  if (t < BREAK) {
    const fr = seg(t, FREEZE[0], FREEZE[1]), cr = seg(t, CRACK, BREAK - 0.04);
    const shards = shardsOf(actor, o.shards, S, C);
    for (const s of shards)
      for (const q of s.px) {
        const v = 1 - (q.y - top) / H; // 0 at the feet, 1 at the head
        let c = q.c;
        if (v < fr * 1.1) c = Math.abs(v - fr * 1.1) < 0.07 && fr < 1 ? WHITE : ice(q);
        // cracks: borders between shards turn white, spreading out from the middle of the body
        if (q.crack && cr > 0 && Math.abs(q.y + 10) / 10 < cr * 1.2) c = WHITE;
        p.px(q.x, q.y, t >= BREAK - 0.035 ? WHITE : c);
      }
    if (fr > 0) p.glow(0, -10, 18, C[5], 0.2 * fr);
    return;
  }
  const te = t - BREAK, fade = 1 - seg(te, 0.85, 1.22);
  // the shards: each tumbles as a rigid piece, catching a highlight as it turns
  shardsOf(actor, o.shards, S, C).forEach((s, i) => {
    const r = rng(S, 100 + i), [x, y, ang] = tumble(te, s, r), cs = Math.cos(ang), sn = Math.sin(ang);
    const shine = Math.sin(ang * 2 + i) > 0.7; // a shard flashes as its face turns to the light
    p.shade(x - s.R, y - s.R, x + s.R, y + s.R, (lx, ly, out) => {
      if (ly > 0) return;
      const dx = lx - x, dy = ly - y, q = s.grid.get(`${Math.floor(s.cx + dx * cs + dy * sn)},${Math.floor(s.cy - dx * sn + dy * cs)}`);
      if (!q) return;
      out.a = fade;
      return te < 0.04 ? WHITE : shine && (q.crack || q.y < s.cy - 1) ? at(C, 0.95) : ice(q);
    });
  });
  // the burst: a white flash, frost glitter flung out
  if (te < 0.06) p.glow(0, -10, 30, C[6], 0.6);
  burst(16, S + 3, (r) => {
    const a = r.range(0, TAU), v = r.range(50, 110), life = r.range(0.3, 0.6);
    if (te > life) return;
    const k = te / life, [x, y] = fly(r.range(-4, 4), -10 + r.range(-6, 6), Math.cos(a) * v, Math.sin(a) * v - 30, te, 160, 2.5);
    if (y > -1 || (k > 0.6 && Math.floor(te * 24 + r.next() * 4) % 2)) return;
    p.px(x, y, k < 0.4 ? WHITE : at(C, 0.75));
    p.light(x, y, C[5], 0.35 * (1 - k));
  });
}
