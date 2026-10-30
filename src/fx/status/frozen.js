import { PAL, cycle, rand, clamp, TAU, WHITE } from "../../core/index.js";
import { steps, geom, recolor, tone } from "./_lib.js";

export const meta = {
  name: "Frozen",
  desc: "The target is frosted blue and crusted in ice: crystals jut from its outline, a block grips its feet, a glint hops between shards, frost drifts.",
  tags: ["status", "ice", "freeze", "frozen", "stun", "debuff", "loop"],
  size: [40, 44],
  origin: [20, 39],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.ice, count: 7, seed: 3 },
};

const SHARDS = new WeakMap();
// crystals: spots on the outline, spread apart, facing up or out, each pointing along its outward normal
function shards(a, n, seed) {
  const key = SHARDS.get(a.mask)?.[`${n}:${seed}`];
  if (key) return key;
  const g = geom(a.mask), picks = [];
  const cand = g.outline
    .map(([x, y]) => ({ x, y, nr: g.near(x, y), r: rand(seed, x, y) }))
    .filter((c) => c.nr && c.y >= 2 && c.y < a.h - 6 && c.nr[2] <= 0.2)
    .sort((p, q) => p.r - q.r);
  for (const c of cand) {
    if (picks.length >= n) break;
    if (picks.some((q) => Math.hypot(q.x - c.x, q.y - c.y) < 4.5)) continue;
    const [d, vx, vy] = c.nr, nx = vx / d, ny = vy / d - 0.35, L = Math.hypot(nx, ny);
    picks.push({ x: c.x, y: c.y, nx: nx / L, ny: ny / L, len: 3.5 + c.r * 3.5, twin: rand(seed, c.x, c.y, 2) < 0.5 ? -0.6 : 0.6 });
  }
  const m = SHARDS.get(a.mask) ?? {};
  m[`${n}:${seed}`] = picks;
  SHARDS.set(a.mask, m);
  return picks;
}

export function draw(p, t, o) {
  const C = steps(o.palette), a = o.actor, S = o.seed, D = meta.duration, ph = t / D;
  // frost: the character recolored down the ice ramp by brightness (a dithered tint where nothing is under it)
  recolor(p, a, (c, mx, my) => (c ? C[clamp(Math.round(1.4 + tone(c) * 5.6), 1, 7)] : C[mx + my < 12 ? 6 : 5]), (mx, my) => (p.get(a.x + mx, a.y + my) ? 1 : 0.5));

  // ice block gripping the feet: faceted, lit along its top edge
  const bw = a.w / 2 + 2.5;
  p.poly([[-bw, 0], [-bw + 1, -3], [-bw + 4, -5], [-1, -4], [2, -5.5], [bw - 2, -4], [bw, -2], [bw, 0]], (x, y) => {
    const facet = Math.floor((x + y * 0.6 + 20) / 4) % 3;
    return y < -3.6 ? C[7] : facet === 0 ? C[6] : facet === 1 ? C[5] : C[4];
  });

  // crystals jutting out of the outline
  const list = shards(a, o.count, S);
  const glintAt = Math.floor(ph * list.length * 2) % list.length, glint = (ph * list.length * 2) % 1;
  const crystal = (bx, by, nx, ny, len, w) => {
    const tx = bx + nx * len, ty = by + ny * len, px = -ny * w, py = nx * w;
    p.tri(bx + px, by + py, tx, ty, bx - nx, by - ny, C[6]);
    p.tri(bx - px, by - py, tx, ty, bx - nx, by - ny, C[3]);
    p.px(tx, ty, C[7]);
    return [tx, ty];
  };
  list.forEach((s, i) => {
    const bx = a.x + s.x + 0.5, by = a.y + s.y + 0.5, c = Math.cos(s.twin), sn = Math.sin(s.twin);
    crystal(bx, by, s.nx * c - s.ny * sn, s.nx * sn + s.ny * c, s.len * 0.6, 1.4);
    const [tx, ty] = crystal(bx, by, s.nx, s.ny, s.len, 1.9);
    if (i === glintAt && glint < 0.5) {
      const k = Math.round(2 * Math.sin(glint * 2 * Math.PI));
      p.line(tx - k, ty, tx + k, ty, WHITE), p.line(tx, ty - k, tx, ty + k, WHITE);
      p.light(tx, ty, C[6], 0.6);
    }
  });

  // frost motes drifting down, now and then catching the light
  cycle(t, D, 7, S + 1, (r) => r.range(1.2, 1.9), (age, life, r) => {
    const k = age / life, x = a.x + r.range(-6, a.w + 6) + Math.sin(age * 2 + r.next() * TAU) * 2, y = a.y - r.range(0, 6) + age * r.range(7, 11);
    if (y > -1) return;
    const tw = Math.sin(age * 7 + r.next() * TAU) > 0.75;
    if (tw) p.px(x - 1, y, C[6]), p.px(x + 1, y, C[6]), p.px(x, y - 1, C[6]), p.px(x, y + 1, C[6]);
    p.px(x, y, tw ? WHITE : k < 0.6 ? C[6] : C[5]);
  });

  p.glow(0, a.y + 9, 22, C[5], 0.18);
}
