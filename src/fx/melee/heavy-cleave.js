import { PAL, ramp, at, rand, burst, fly, seg, ease, clamp, WHITE } from "../../core/index.js";
import { swing, glint, dustCloud } from "./_lib.js";

export const meta = {
  name: "Heavy cleave",
  desc: "A two-handed overhead cleave: a glint behind the head, a thick arc that speeds up as it falls, and a slam into the floor that throws dust and grit.",
  tags: ["melee", "slash", "cleave", "greatsword", "heavy", "ground", "combat", "directional", "one-shot"],
  size: [92, 58],
  origin: [30, 48],
  duration: 0.75,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.ember, radius: 27, seed: 6 },
};

const DUST = ramp(["#2e2830", "#463e48", "#655b63", "#8a7f84", "#b0a5a6", "#d6cdc8"]);
const CRACK = ramp(["#0c0a10", "#5a5262"]);

export function draw(p, t, o) {
  const C = ramp(o.palette), R = o.radius, S = o.seed, top = C.length - 1;
  const cx = 1, cy = -15, A0 = -2.7, A1 = Math.asin(clamp(-cy / R)); // the arc ends on the floor in front
  const hx = cx + Math.cos(A1) * R, HIT = 0.14;
  // wind-up: a glint where the blade waits behind the head
  if (t < 0.075) {
    const gx = cx + Math.cos(A0) * (R - 2), gy = cy + Math.sin(A0) * (R - 2);
    glint(p, gx, gy, t < 0.035 ? 2 : 3, C[top - 1]);
    p.glow(gx, gy, 8, C[top - 2], 0.4);
  }
  // the swing speeds up as it falls (heavy), and the smear burns out after the slam
  const lead = ease.inQuad(seg(t, 0.05, HIT)), tail = ease.inCubic(seg(t, 0.09, 0.32));
  swing(p, { cx, cy, r: R, w: 12, from: A0, to: A1, lead, tail, C, fade: seg(t, HIT + 0.02, 0.27) });
  if (t > 0.05 && t < 0.3) {
    const la = A0 + (A1 - A0) * lead;
    p.glow(cx + Math.cos(la) * (R - 4), cy + Math.sin(la) * (R - 4), 18, C[top - 2], 0.45 * (1 - seg(t, HIT, 0.3)));
  }
  const q = t - HIT; // time since the slam
  if (q < 0) return;
  // cracks in the floor, out from the hit both ways
  const cr = ease.outCubic(seg(q, 0, 0.08)) * (1 - seg(t, 0.55, 0.75));
  if (cr > 0) {
    for (const side of [-1, 1]) {
      let x = hx, y = 1;
      const n = Math.round((side > 0 ? 10 : 7) * cr);
      for (let i = 0; i < n; i++) {
        const nx = x + side, ny = clamp(y + (rand(S, i, side + 5) - 0.5) * 1.6, 1, 3);
        p.px(nx, Math.round(ny), CRACK[0]);
        if (i < n - 2) p.px(nx, Math.round(ny) - 1, CRACK[1]);
        (x = nx), (y = ny);
      }
    }
  }
  // the slam: a white dome and a flash along the floor for a frame, then hot, then gone
  if (q < 0.07) {
    const hot = q < 0.034;
    p.ellipse(hx, 0, hot ? 10 : 6, hot ? 7 : 4, (d) => (d < 0.55 ? WHITE : hot ? C[top] : C[top - 1]), (d, ang) => (ang <= 0.05 ? 1 : 0));
    p.line(hx - (hot ? 20 : 12), 0, hx + (hot ? 26 : 16), 0, (u) => (Math.abs(u - 0.43) < 0.2 ? WHITE : C[top - 1]));
    // streaks shooting up off the floor
    for (const [dx, h] of [[-7, 8], [-3, 15], [1, 18], [4, 13], [8, 7]]) p.line(hx + dx, -2, hx + dx * 1.7, -h * (hot ? 1 : 0.6), (u) => (u < 0.5 ? WHITE : C[top - 1]));
  }
  p.glow(hx, -2, 32, C[top - 2], 0.55 * Math.pow(1 - seg(q, 0, 0.3), 2));
  p.glow(hx, -1, 9, C[top], 0.7 * (1 - seg(q, 0, 0.12)));
  // dust rolls out along the floor both ways (more away from the fighter), lifts, swells and thins away
  const puffs = [];
  burst(14, S + 1, (r, i) => {
    const side = i < 5 ? -1 : 1, born = r.range(0, 0.06), age = q - born, life = r.range(0.38, 0.56);
    if (age < 0 || age > life) return;
    const k = age / life, reach = (side > 0 ? r.range(6, 28) : r.range(4, 14)) * ease.outCubic(seg(age, 0, 0.32));
    puffs.push({
      x: hx + side * (r.range(1, 4) + reach), y: -r.range(2, 3.5) - age * r.range(4, 10),
      r: r.range(2.6, 4.4) * (0.5 + 0.7 * ease.outCubic(seg(k, 0, 0.4))) * (1 - 0.75 * ease.inQuad(seg(k, 0.45, 1))), a: 1 - seg(k, 0.7, 1),
    });
  });
  dustCloud(p, puffs, DUST, S, 0.2, 0.7);
  // grit and chips thrown up, falling back
  burst(8, S + 2, (r) => {
    const a = -Math.PI / 2 + r.range(-1.1, 1.1), sp = r.range(50, 100), life = r.range(0.35, 0.5);
    if (q > life) return;
    const [x, y] = fly(hx, -1, Math.cos(a) * sp, Math.sin(a) * sp, q, 300, 0.5);
    if (y > 0) return;
    const c = at(DUST, r.range(0.4, 1));
    p.px(x, y, c);
    if (r.next() < 0.4) p.px(x + 1, y, c);
  });
  // a few embers knocked loose
  burst(5, S + 3, (r) => {
    const a = -Math.PI / 2 + r.range(-1.3, 1.3), sp = r.range(60, 120), life = r.range(0.2, 0.3);
    if (q > life) return;
    const [x, y] = fly(hx, -2, Math.cos(a) * sp, Math.sin(a) * sp, q, 200, 3), k = q / life;
    p.px(x, y, k < 0.4 ? WHITE : C[top - 1]);
    p.light(x, y, C[top - 2], 0.5 * (1 - k));
  });
}
