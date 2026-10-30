import { burst, seg, ease, clamp, rand, bump, TAU, WHITE } from "../../core/index.js";
import { steps, UMBRA, SKULL_11, shape } from "./_lib.js";

export const meta = {
  name: "Curse",
  desc: "Dark wisps gather over the head, a violet skull stamps in with a flash, eyes burning, the curse drips down over the target, then the skull crumbles.",
  tags: ["shadow", "curse", "skull", "debuff", "hex", "one-shot"],
  size: [48, 60],
  origin: [24, 55],
  duration: 1.5,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: UMBRA, seed: 10 },
};

const STAMP = 0.28; // the skull lands

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, a = o.actor;
  const hx = a.head[0], hy = a.head[1] - 13; // the skull's center, over the head
  const crumble = seg(t, 1.05, 1.4), bob = Math.round(Math.sin((t - STAMP) * 7) * 1.2);

  // gathering: wisps spiral in to where the skull will be
  burst(7, S, (r) => {
    const a0 = r.range(0, TAU), r0 = r.range(14, 20), delay = r.range(0, 0.08), q = clamp((t - delay) / (STAMP - delay));
    if (q <= 0 || q >= 1) return;
    for (let j = 3; j >= 0; j--) {
      const e = ease.inQuad(Math.max(0, q - j * 0.06)), ang = a0 + e * 2.4, rr = r0 * (1 - e);
      const x = hx + Math.cos(ang) * rr, y = hy + Math.sin(ang) * rr * 0.8;
      if (j === 0) p.px(x, y, C[7]);
      else p.circle(x, y, 1.6 - j * 0.35, j === 1 ? C[5] : C[3]);
    }
  });

  // the curse falls: drips of shadow slide down from the skull over the target
  burst(8, S + 1, (r, i) => {
    const born = STAMP + 0.08 + r.range(0, 0.3), age = t - born, life = r.range(0.45, 0.65);
    if (age < 0 || age > life) return;
    const k = age / life, side = i % 2 ? 1 : -1, x0 = hx + side * r.range(1, 5);
    const y = hy + 4 + ease.inQuad(k) * (-hy - 2), x = x0 + side * Math.sin(k * Math.PI) * r.range(3, 6);
    p.circle(x, y - 2, 1.2, C[3]);
    p.circle(x, y, 1.4, k < 0.7 ? C[5] : C[3]);
    p.px(x, y + 1, C[7]);
  });
  // the mark takes: the target's outline flickers violet a few times
  const mark = bump(t, STAMP + 0.15, STAMP + 0.75);
  if (mark > 0 && Math.sin(t * 50) > -0.2) p.outline(a.mask, a.x, a.y, mark > 0.5 ? C[6] : C[4]);

  // the skull: a 2x white flash as it lands, then violet, bobbing, eyes burning, crumbling at the end
  if (t >= STAMP - 0.02 && crumble < 1) {
    const land = t < STAMP + 0.05;
    const sx = Math.round(hx) - 5, sy = Math.round(hy) - 5 + (land ? 0 : bob) - Math.round(crumble * 4);
    if (land) {
      for (let my = 0; my < 11; my++)
        for (let mx = 0; mx < 11; mx++) {
          const ch = SKULL_11[my][mx];
          if (ch !== ".") p.rect(sx - 5 + mx * 2, sy - 5 + my * 2, 2, 2, ch === "#" ? WHITE : C[6]);
        }
    } else {
      const eye = 0.6 + 0.4 * Math.sin(t * 18);
      shape(p, SKULL_11, sx, sy, (ch, mx, my) => {
        if (rand(S, mx, my) < crumble * 1.1) return 0;
        if (ch === "e") return my === 5 && (mx === 2 || mx === 8) ? (eye > 0.5 ? C[7] : C[6]) : C[0];
        if (ch === "n" || ch === "t") return C[1];
        const lit = mx + my;
        return lit < 6 ? C[7] : lit < 11 ? C[6] : lit < 15 ? C[5] : C[4];
      });
      p.light(sx + 2, sy + 5, C[7], 0.5 * eye * (1 - crumble));
      p.light(sx + 8, sy + 5, C[7], 0.5 * eye * (1 - crumble));
    }
    p.glow(hx, hy, 18, C[5], (land ? 0.6 : 0.25) * (1 - crumble));
  }
  // dust of the crumbling skull, falling and fading
  burst(14, S + 2, (r) => {
    const age = t - 1.05 - r.range(0, 0.12), life = r.range(0.2, 0.28);
    if (age < 0 || age > life) return;
    p.px(hx + r.range(-5, 5) + r.range(-8, 8) * age, hy + r.range(-5, 4) + 30 * age * age - 6 * age, age / life < 0.5 ? C[6] : C[4]);
  });
}
