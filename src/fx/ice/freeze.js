import { PAL, burst, rng, seg, ease, fly, bolt, TAU, WHITE } from "../../core/index.js";
import { fit, shard, shardPts, glint } from "./_lib.js";

export const meta = {
  name: "Freeze",
  desc: "Frost creeps up the character from the feet, an ice block snaps shut around them, glints, cracks, then bursts apart into shards.",
  tags: ["ice", "freeze", "frozen", "status", "crowd-control", "one-shot"],
  size: [64, 52],
  origin: [32, 44],
  duration: 2.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.ice, seed: 23 },
};

const CREEP = [0.05, 0.5], SNAP = [0.42, 0.56], CRACK = [1.35, 1.72], BREAK = 1.72;
const BX = 9, BH = 24, TOP = 4; // block half-width, height, depth of its top face

export function drawBack(p, t, o) {
  const I = fit(o.palette);
  // frost spreading on the floor around the feet, melting after the break
  const f = ease.outCubic(seg(t, 0.02, 0.4)) * (1 - ease.inQuad(seg(t, BREAK + 0.15, 2.3)));
  if (f > 0.05) p.ellipse(0, 0.5, 14 * f, 2.5 * f, (d) => (d > 0.8 ? I[6] : I[5]));
  // the block's far edges, seen through the ice
  const s = blockRise(t);
  if (s > 0 && t < BREAK) {
    const top = -BH * s;
    p.line(-BX + TOP, top - TOP, BX + TOP, top - TOP, I[4]);
    p.line(BX + TOP, top - TOP, BX + TOP, -TOP + 0.5, I[3]);
  }
}

const blockRise = (t) => ease.outBack(seg(t, SNAP[0], SNAP[1]), 1.6);

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, A = o.actor;
  // frost on the character: it turns to ice from the feet up, a bright edge creeping ahead
  if (t < BREAK) {
    const line = -A.h * ease.inOutSine(seg(t, CREEP[0], CREEP[1]));
    // (a color of 0 would still be written and punch a hole, so the alpha does the masking)
    const iced = (mx, my) => (A.y + my >= line - 0.5 ? 1 : 0);
    p.mask(A.mask, A.x, A.y, (mx, my) => {
      if (A.y + my < line + 1) return I[7];
      return mx < 4 || (mx + my) % 7 === 0 ? I[6] : mx > 8 ? I[4] : I[5];
    }, iced);
    p.outline(A.mask, A.x, A.y, I[3], iced);
  }
  const s = blockRise(t), jit = t > CRACK[0] && t < BREAK ? (Math.floor(t * 30) % 2 ? 1 : -1) * Math.round(seg(t, CRACK[0] + 0.15, BREAK)) : 0;
  if (s > 0 && t < BREAK) {
    const top = Math.round(-BH * s), x0 = -BX + jit, x1 = x0 + BX * 2 - 1;
    if (t >= SNAP[0] + 0.06 && t < SNAP[0] + 0.094) {
      // the snap: one frame of solid white block
      p.rect(x0, top - TOP, BX * 2 + TOP, -top + TOP, WHITE);
    } else {
      // clear ice: hard edges, a top face catching the light, a darker side, streaks of shine
      p.poly([[x0, top], [x0 + TOP, top - TOP], [x1 + 1 + TOP, top - TOP], [x1 + 1, top]], I[6]);
      p.poly([[x1 + 1, top], [x1 + 1 + TOP, top - TOP], [x1 + 1 + TOP, -TOP], [x1 + 1, 0]], I[3]);
      p.line(x1 + TOP, top - TOP + 1, x1 + TOP, -TOP, I[2]);
      p.line(x0, top, x0, -1, I[6]);
      p.line(x1, top, x1, -1, I[4]);
      p.line(x0, top, x1, top, I[7]);
      p.line(x0, -1, x1, -1, I[4]);
      for (const [a, b] of [[4, 3], [7, 4], [14, 3]]) p.line(x0 + a, top + 2, x0 + a - b, top + 2 + b * 1.4, I[7]);
      p.line(x1 - 2, -3, x1 - 5, -7, I[6]);
      // a shine band sweeping across
      const sw = seg(t, 0.75, 1.2);
      if (sw > 0 && sw < 1) {
        const sx = x0 - 6 + sw * (BX * 2 + 14);
        p.shade(x0, top, x1, -1, (x, y) => (Math.abs(x - sx + (y - top) * 0.5) < 1 ? I[7] : 0));
      }
      // cracks running out from a point, growing until it gives
      const c = seg(t, CRACK[0], BREAK);
      if (c > 0) {
        const path = bolt(rng(S, 1), x0 + 5, top + 5, x0 + 15, -3, { jag: 0.3, depth: 4 });
        p.polyline(path.slice(0, Math.max(2, Math.floor(path.length * Math.min(1, c * 1.6)))), WHITE);
        if (c > 0.4) p.polyline(bolt(rng(S, 2), x0 + 10, top + 11, x0 + 2, -5, { jag: 0.3, depth: 3 }).slice(0, Math.max(2, Math.floor(9 * (c - 0.4) / 0.6))), WHITE);
      }
      if (t > 0.6 && t < 1.3 && Math.sin(t * 18) > 0.8) glint(p, x1 + 1, top - 1, 2, I[6], WHITE);
    }
  }
  // the break: a white frame, then shards fly out spinning and fall away; frost flakes off the character
  if (t >= BREAK) {
    const b = t - BREAK;
    if (b < 0.034) p.rect(-BX - 1, -BH - TOP - 1, BX * 2 + TOP + 2, BH + TOP + 2, WHITE);
    else burst(16, S + 9, (r, i) => {
      const life = r.range(0.45, 0.65);
      if (b > life) return;
      const x0 = r.range(-BX, BX), y0 = -r.range(2, BH), dir = x0 / BX;
      const [x, y] = fly(x0, y0, dir * r.range(22, 48) + r.range(-10, 10), -r.range(20, 70), b, 360, 1.2);
      if (y > 1) return;
      const sz = r.range(1.8, 3.4);
      shard(p, x, Math.min(y, -sz), shardPts(r, sz), r.range(0, TAU) + b * r.range(-12, 12), I, 1 - seg(b, life * 0.65, life));
    });
    burst(10, S + 10, (r) => {
      const life = r.range(0.3, 0.5);
      if (b > life) return;
      const [x, y] = fly(r.range(-5, 5), -r.range(2, 18), r.range(-30, 30), -r.range(10, 40), b, 200, 2);
      if (y < 0) p.px(x, y, b / life < 0.5 ? I[7] : I[5]);
    });
    p.glow(0, -12, 30, I[5], 0.45 * (1 - seg(b, 0, 0.35)));
  }
  p.glow(0, -12, 24, I[4], 0.15 * seg(t, 0.4, 0.6) * (1 - seg(t, BREAK, BREAK + 0.2)));
}
