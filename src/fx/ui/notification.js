import { PAL, RAMP, seg, ease, bump, WHITE } from "../../core/index.js";
import { Layer, fit } from "./_lib.js";

export const meta = {
  name: "Notification",
  desc: "A gold bell swings hard on its hook and rings, the clapper lagging behind, ping arcs spreading out; a red badge with a 1 pops on its shoulder.",
  tags: ["ui", "notification", "bell", "alert", "badge", "one-shot"],
  size: [56, 48],
  origin: [28, 30],
  duration: 1.6,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.gold, count: "1", seed: 11 },
};

const L = new Layer(56, 48);
const RED = RAMP.blood, PY = -20;

// the swing: a hard ring that dies away, the clapper a beat behind
const swing = (t) => 0.5 * Math.sin(t * 30) * Math.max(0, 1 - t / 0.75) * (t < 0.75 ? 1 : 0);

export function draw(p, t, o) {
  const C = fit(o.palette), out = seg(t, 1.35, 1.55);
  if (out >= 1) return;
  const th = swing(t), tc = swing(Math.max(0, t - 0.05)) * 1.3, cs = Math.cos(th), sn = Math.sin(th);
  const pop = ease.outBack(seg(t, 0, 0.12), 3), sc = pop * (1 - ease.inBack(out, 2));
  if (sc <= 0.05) return;
  L.begin(-28, -30);
  L.fill(-16, -24, 16, 4, (x, y) => {
    // into the bell's own space: rotated about its hook, scaled by the pop
    const dx = x / (sc * 1.2), dy = (y - PY) / (sc * 1.2), xx = dx * cs + dy * sn, yy = -dx * sn + dy * cs;
    if (Math.hypot(xx, yy) < 1.7) return xx < 0 ? C[6] : C[4]; // the knob
    const cx = Math.sin(tc - th) * 3;
    if (Math.hypot(xx - cx, yy - 14.5) < 1.8) return xx - cx < 0 ? C[5] : C[3]; // the clapper
    if (yy < 1 || yy > 13) return 0;
    // a domed crown, near-straight waist, a flared lip
    const v = (yy - 1) / 12, w = 6.4 * (0.4 + 0.6 * Math.sqrt(v)) + (yy > 11.4 ? 1.3 : 0) - (yy < 1.8 ? 1 : 0);
    if (Math.abs(xx) > w) return 0;
    const u = xx / w;
    if (yy > 11.4) return yy < 12.4 ? (u < 0.3 ? C[6] : C[5]) : u < 0.4 ? C[4] : C[3]; // the lip
    return u < -0.78 ? C[4] : u < -0.4 ? C[6] : u < 0.25 ? C[5] : u < 0.62 ? C[4] : C[3];
  });
  L.outline(C[1]);
  L.draw(p);
  // ping arcs spread out from both sides while it rings
  for (let i = 0; i < 3; i++) {
    const k = seg(t, 0.05 + i * 0.16, 0.45 + i * 0.16);
    if (k <= 0 || k >= 1) continue;
    const r = 13 + 9 * ease.outCubic(k), c = k < 0.45 ? C[6] : C[4], a = k < 0.7 ? 1 : 0.5;
    p.arc(0, -11, r, 1, -0.55, 0.55, c, a);
    p.arc(0, -11, r, 1, Math.PI - 0.55, Math.PI + 0.55, c, a);
  }
  // the badge pops onto its shoulder
  const bk = seg(t, 0.42, 0.56);
  if (bk > 0) {
    const r = 4.5 * ease.outBack(bk, 3) * (1 - ease.inBack(out, 2)), bx = 8, by = -16;
    if (r > 0.6) {
      p.circle(bx, by, r + 1, RED[1]);
      p.circle(bx, by, r, (d, a) => (d > 0.65 && Math.sin(a) < 0 && Math.cos(a) < 0.5 ? RED[6] : RED[4]));
      if (r > 3.5) p.text(o.count, bx, by - 2, WHITE, { align: "center" });
      if (bk < 1) p.ring(bx, by, r + 2 + 4 * bk, 1, WHITE, 1 - bk);
    }
  }
  p.glow(0, -9, 24, C[4], 0.2 * bump(t, 0, 0.9));
}
