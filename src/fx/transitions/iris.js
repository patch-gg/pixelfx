import { PAL, hex, ease, seg, lerp } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Iris",
  desc: "A cartoon iris: the circle closes fast onto a small spotlight, holds a beat, snaps shut, then pops open and widens away.",
  tags: ["iris", "circle", "cartoon"],
  duration: 1.5,
  options: { palette: PAL.holy, cx: 80, cy: 45, radius: 13 },
});

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), n = C.length;
  const { cin, cout, out } = timeline(t, meta.duration);
  const cx = o.cx, cy = o.cy, r0 = o.radius;
  const R = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)) + 4;
  let r;
  if (!out) {
    // close onto the spotlight, hold it, then a tiny wind-up and shut
    r = cin < 0.6 ? lerp(R, r0, ease.outCubic(seg(cin, 0, 0.6))) : r0 * (1 - ease.inBack(seg(cin, 0.78, 1), 2.4));
  } else {
    // pop open past the spotlight, settle, then accelerate away
    r = cout < 0.36 ? r0 * ease.outBack(seg(cout, 0, 0.2), 2.2) : lerp(r0, R, ease.inCubic(seg(cout, 0.36, 1)));
  }
  if (r <= 0.4) return fill(p, ink);
  if (r >= R) return;
  const rim = C[n - 1], mid = C[Math.max(0, n - 3)], deep = C[Math.max(0, n - 5)];
  const small = 1 - seg(r, r0 * 2, r0 * 5); // the rim shines while the circle is small
  screen(p, (x, y) => {
    const d = Math.hypot(x - cx, y - cy) - r;
    if (d < 0) return;
    if (d < 1) return rim;
    if (d < 2) return small > 0.5 ? mid : ink;
    if (d < 3 && small > 0.5) return deep;
    return ink;
  });
  if (r < R * 0.45) {
    p.glowRing(cx, cy, r, 5, C[n - 3], 0.3 * (0.4 + 0.6 * small));
    p.glow(cx, cy, r + 2, C[n - 2], 0.12 * small);
  }
}
