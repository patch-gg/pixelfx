import { PAL, ramp, at, burst, cycle, fly, seg, ease, WHITE } from "../../core/index.js";
import { actorOf } from "./_lib.js";

export const meta = {
  name: "Respawn beam",
  desc: "A beam slams down onto the spawn point, the character is written in from the feet up as glowing scanlines, flashes white and steps out as the beam closes.",
  tags: ["spawn", "respawn", "teleport", "beam", "sci-fi", "one-shot"],
  size: [48, 88],
  origin: [24, 82],
  duration: 1.5,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.cyber, seed: 29 },
};

const FLASH = 0.72; // the written-in silhouette flashes white; the character is there from here on

/** The stand-in (or your own sprite) is hidden until the flash, then shows through as the tint fades off it. */
export const actorAlpha = (t) => (t < FLASH ? 0 : 1);

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, a = actorOf(o), m = a.mask, TOP = -meta.origin[1] + 1;
  const drop = ease.inQuad(seg(t, 0, 0.07)), open = ease.outCubic(seg(t, 0.05, 0.16)), shut = ease.inCubic(seg(t, 0.84, 1.08));
  const fill = seg(t, 0.2, FLASH), flash = t >= FLASH && t < FLASH + 0.07, reveal = seg(t, 0.8, 1.04);
  const rows = Math.floor(fill * (m.h + 1));
  // the beam: a white core while it lands, then two hard edges, inner rails that flicker and dashes climbing
  // between them; the body of it is light, so the character being written in reads against it
  const w = (0.7 + 8 * open) * (1 - shut), tip = TOP * (1 - drop), frame = Math.floor(t * 30);
  if (w > 0.4 && t < 1.08) {
    const core = 1 - seg(t, 0.1, 0.26), cw = Math.max(0.6, w * 0.55 * core);
    if (core > 0) p.rect(-Math.round(cw), TOP, Math.round(cw) * 2, tip - TOP, WHITE);
    const ew = Math.round(w);
    p.rect(-ew, TOP, 1, tip - TOP, at(C, 0.86));
    p.rect(ew - 1, TOP, 1, tip - TOP, at(C, 0.86));
    if (ew > 3 && frame % 3 !== 0) {
      p.rect(-ew + 2, TOP, 1, tip - TOP, at(C, 0.6));
      p.rect(ew - 3, TOP, 1, tip - TOP, at(C, 0.6));
    }
    for (let i = 0; i < 9; i++) {
      const y = tip - ((i * 13 + t * 90) % (tip - TOP)), x = -ew + 2 + ((i * 5) % Math.max(1, ew * 2 - 4));
      if (y > TOP) p.line(x, y, x, y + 2, at(C, 0.75));
    }
    p.glowLine(0, TOP, 0, tip, w * 1.6 + 3, at(C, 0.65), 0.45);
  }
  // the landing: a ring racing out across the floor, sparks kicked up
  const ring = seg(t, 0.06, 0.42);
  if (ring > 0 && ring < 1) {
    const e = ease.outCubic(ring);
    p.ellipse(0, 0.5, 5 + 18 * e, 1.5 + 3 * e, at(C, 0.86), (d) => (d > 0.78 ? 1 - ring : 0));
  }
  burst(10, S, (r) => {
    const age = t - 0.07, life = r.range(0.2, 0.4);
    if (age < 0 || age > life) return;
    const ang = -Math.PI / 2 + r.range(-1.3, 1.3), v = r.range(40, 90), [x, y] = fly(r.range(-4, 4), -1, Math.cos(ang) * v, Math.sin(ang) * v, age, 200, 1.5);
    if (y > 0) return;
    p.px(x, y, age / life < 0.5 ? WHITE : at(C, 0.75));
  });
  // the character, written in row by row from the feet: a white write head, scanlines behind it, then it steps out
  if (rows > 0 && reveal < 1)
    for (let my = m.h - rows; my < m.h; my++)
      for (let mx = 0; mx < m.w; mx++) {
        if (!m.data[my * m.w + mx]) continue;
        const head = my === m.h - rows && fill < 1;
        p.dot(a.x + mx, a.y + my, flash || head ? WHITE : (my & 1) ? at(C, 0.84) : at(C, 0.68), 1 - reveal);
      }
  // motes rising through the beam, then off the character as it settles
  cycle(t, meta.duration, 10, S + 1, (r) => r.range(0.4, 0.7), (age, life, r) => {
    if (t > 1.3) return;
    const k = age / life, x = r.range(-5, 5), y = -1 - age * r.range(30, 60);
    if (Math.abs(x) > w + 2 && t < 1) return;
    p.px(x, y, k < 0.4 ? WHITE : at(C, 0.7));
  });
  const glow = seg(t, 0, 0.1) * (1 - seg(t, 0.9, 1.4));
  p.glow(0, -10, 24, at(C, 0.62), 0.4 * glow);
  if (flash) p.glow(0, -10, 16, WHITE, 0.4);
}
