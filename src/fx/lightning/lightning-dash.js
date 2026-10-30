import { PAL, burst, fly, flyV, seg, ease, rng, rand, TAU, WHITE } from "../../core/index.js";
import { steps, zap, glowPath, part, jagged, branches, crumble } from "./_lib.js";

export const meta = {
  name: "Lightning dash",
  desc: "A dash to the right on a streak of lightning: a white-hot head tears ahead, the bolt behind it crackles and crumbles from the tail, sparks burst where it lands.",
  tags: ["lightning", "electric", "dash", "movement", "directional", "one-shot"],
  size: [112, 40],
  origin: [12, 33],
  duration: 0.52,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.volt, length: 76, seed: 19 },
};

const Y = -9, RUN = 0.1;

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, L = o.length, beat = Math.floor(t * 20);
  const run = ease.outQuart(seg(t, 0, RUN)), hx = L * run;

  // the trail: a bolt from the start to the head, re-forming every beat; it crumbles from the tail
  const path = jagged(rng(S, beat), 0, Y, L, Y, { step: 5, amp: 3 });
  const trail = part(path, run);
  const decay = seg(t, 0.14, 0.42);
  if (decay < 1) {
    if (t < 0.2) {
      for (const b of branches(rng(S, beat, 1), trail, { count: 3, len: 10, from: 0.1, to: 0.8 })) p.polyline(b, t < 0.1 ? C[5] : C[4]);
      zap(p, trail, t < 0.1 ? WHITE : C[6], t < 0.14 ? C[4] : null);
    } else crumble(p, trail, decay, S + 3, decay < 0.4 ? C[5] : C[4]);
    glowPath(p, trail, 8, C[4], 0.4 * (1 - decay));
  }

  // where it left from: a flash on the floor that shrinks away, a couple of backward skids
  const kick = seg(t, 0, 0.16);
  if (kick < 1) {
    const w = Math.round(7 * (1 - kick));
    p.rect(-w, 0, w * 2 + 1, 1, kick < 0.4 ? WHITE : C[5]);
    p.rect(-w - 3, -1, 2, 1, C[4]);
    p.light(0, -1, C[4], 0.6 * (1 - kick));
  }

  // the head: a white-hot spark racing ahead, flaring as it lands
  if (t < RUN + 0.08) {
    const land = seg(t, RUN, RUN + 0.08), r = land > 0 ? 6 * (1 - land) : 3;
    p.circle(hx, Y, r, land > 0.5 ? C[6] : WHITE);
    if (land === 0) p.line(hx - 10, Y, hx, Y, C[6]);
    p.glow(hx, Y, 18, C[4], 0.5);
  }

  // the landing: sparks thrown forward and up, a few crackles round the arrival point
  burst(10, S + 5, (r) => {
    const age = t - RUN - r.range(0, 0.04), life = r.range(0.2, 0.36);
    if (age < 0 || age > life) return;
    const a = r.range(-2.6, 0.6), sp = r.range(45, 90), vx0 = Math.cos(a) * sp + 12, vy0 = Math.sin(a) * sp;
    const [x, y] = fly(L, Y, vx0, vy0, age, 260, 2.5), [vx, vy] = flyV(vx0, vy0, age, 260, 2.5), q = age / life;
    if (y > 0) return;
    p.line(x, y, x - vx * 0.03, y - vy * 0.03, q < 0.35 ? WHITE : q < 0.7 ? C[5] : C[3]);
  });
  if (t > RUN && t < 0.4 && beat % 2 === 0) {
    const r = rng(S, beat, 9), a = r.range(0, TAU), l = r.range(4, 8);
    p.polyline(jagged(r, L, Y, L + Math.cos(a) * l, Y + Math.sin(a) * l, { step: 2.5, amp: 1.4 }), C[5]);
  }
  // little arcs dropping from the trail to the floor as it passes
  burst(3, S + 7, (r, i) => {
    const x = L * r.range(0.2, 0.85), born = (x / L) * RUN * 0.6, age = t - born;
    if (age < 0 || age > 0.1 || rand(S, i, beat) < 0.3) return;
    p.polyline(jagged(r, x, Y + 2, x + r.range(-4, 4), 0, { step: 2.5, amp: 1.5 }), C[4]);
  });
}
