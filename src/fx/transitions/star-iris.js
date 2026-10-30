import { PAL, hex, seg, lerp, wrap, TAU, WHITE } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Star iris",
  desc: "A five-point star iris spins shut with a gold rim, twinkles at its tips as it vanishes, then spins back open the other way.",
  tags: ["iris", "star", "cartoon", "magic"],
  duration: 1.5,
  options: { palette: PAL.gold, points: 5, cx: 80, cy: 45, inner: 0.48 },
});

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), n = C.length, N = Math.max(3, o.points | 0);
  const { cin, cout, out } = timeline(t, meta.duration);
  const cx = o.cx, cy = o.cy, ratio = o.inner;
  // big enough that the inner corners clear every screen corner
  const far = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy));
  const Rmax = far / (ratio * Math.cos(Math.PI / N)) + 4;
  // fast through the huge sizes, slowing as the star gets small (and the reverse on the way out)
  const k = out ? 1 - cout * cout : 1 - (1 - cin) ** 2.2;
  const R = Rmax * (1 - k);
  if (R <= 0.5) return fill(p, ink);
  if (R >= Rmax) return;
  const rot = -Math.PI / 2 + (out ? -1 : 1) * 2.4 * k;
  const sector = TAU / N, half = sector / 2;
  // the edge from a tip (R, 0) to an inner corner, in the folded sector
  const ax = R, ay = 0, bx = R * ratio * Math.cos(half), by = R * ratio * Math.sin(half);
  const ex = bx - ax, ey = by - ay, el = Math.hypot(ex, ey);
  const rim = C[n - 3], hot = C[n - 2], deep = C[Math.max(0, n - 5)];
  screen(p, (x, y) => {
    const dx = x - cx, dy = y - cy, rho = Math.hypot(dx, dy);
    let f = wrap(Math.atan2(dy, dx) - rot, sector);
    if (f > half) f = sector - f;
    const px = rho * Math.cos(f), py = rho * Math.sin(f);
    const d = ((px - ax) * ey - (py - ay) * ex) / el; // > 0 outside the star
    if (d <= 0) return;
    if (d < 1) return hot;
    if (d < 2) return rim;
    if (d < 3) return deep;
    return ink;
  });
  // twinkles pop at the tips as the star gets small
  const tw = seg(R, 40, 8) * (out ? 1 : 1 - seg(R, 8, 2));
  if (tw > 0) {
    for (let i = 0; i < N; i++) {
      const a = rot + i * sector, tx = cx + Math.cos(a) * (R + 4), ty = cy + Math.sin(a) * (R + 4);
      const s = Math.round(lerp(1, 3, tw) * (0.7 + 0.3 * Math.sin(t * 40 + i * 2)));
      p.line(tx - s, ty, tx + s, ty, hot);
      p.line(tx, ty - s, tx, ty + s, hot);
      p.px(tx, ty, WHITE);
      p.light(tx, ty, C[n - 3], 0.4 * tw);
    }
  }
  p.glow(cx, cy, Math.min(30, R * 0.8 + 4), C[n - 3], 0.25 * seg(R, 60, 10));
}
