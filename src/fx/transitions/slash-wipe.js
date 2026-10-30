import { PAL, hex, ease, burst, fly, WHITE } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, onScreen, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Slash wipe",
  desc: "A blade-bright diagonal edge whips across and drags the cover in behind it, throwing sparks; the cover leaves the same way.",
  tags: ["wipe", "slash", "diagonal", "fast"],
  duration: 1.1,
  options: { palette: PAL.ice, slant: 0.45 },
});

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), n = C.length, S = o.seed, D = meta.duration;
  const { cin, cout, out } = timeline(t, D);
  if (!out && cin >= 1) return fill(p, ink);
  if (out && cout >= 1) return;
  const sl = o.slant, span = sl * H / 2 + 10, nrm = 1 / Math.hypot(1, sl);
  // the edge crosses at x = e + (H/2 - y) * slant: "/" leaning right, moving right, fast in the middle
  const edgeAt = (k) => -span + 14 + (W + span * 2 - 14) * ease.inOutSine(k);
  const e = edgeAt(out ? cout : cin);
  const hot = C[n - 2], mid = C[Math.max(0, n - 4)], deep = C[Math.max(0, n - 6)];
  screen(p, (x, y, o2) => {
    const xe = e + (H / 2 - y) * sl, d = (out ? x - xe : xe - x) * nrm; // > 0 on the cover side
    if (d < -6) return;
    if (d < 0) {
      // light spills a few px ahead of the blade
      o2.l = C[n - 3];
      o2.k = 0.35 * (1 + d / 6) ** 2;
      return;
    }
    if (d < 1.2) return WHITE;
    if (d < 2.4) return hot;
    if (d < 4) return mid;
    if (d < 6) return (Math.floor(x) + Math.floor(y)) & 1 ? deep : ink;
    return ink;
  });
  // sparks grind off the edge and spray back over the cover, arcing down as they cool
  const half = out ? cout : cin, T = (out ? 1 - 0.58 : 0.45) * D, dir = out ? 1 : -1;
  burst(22, S + (out ? 50 : 0), (r) => {
    const k0 = r.range(0.15, 0.85), age = (half - k0) * T;
    const life = r.range(0.14, 0.3);
    if (age < 0 || age > life) return;
    const y0 = r.range(6, H - 6), x0 = edgeAt(k0) + (H / 2 - y0) * sl;
    const vx = dir * r.range(40, 140), vy = r.range(-90, 10);
    const [x, y] = fly(x0, y0, vx, vy, age, 260, 3), q = age / life, c = q < 0.35 ? WHITE : q < 0.7 ? hot : mid;
    const [x1, y1] = fly(x0, y0, vx, vy, Math.max(0, age - 0.02), 260, 3);
    if (onScreen(x, y)) p.px(x, y, c);
    if (q < 0.6 && onScreen(x1, y1)) p.px(x1, y1, mid);
  });
}
