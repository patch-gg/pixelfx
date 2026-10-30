import { PAL, hex, ease, seg } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Diamond wipe",
  desc: "A lattice of diamonds swells across the screen from left to right with bright growing rims, then shrinks away in the same sweep.",
  tags: ["wipe", "diamonds", "pattern", "retro"],
  duration: 1.4,
  options: { palette: PAL.arcane, cell: 16 },
});

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), n = C.length;
  const { cin, cout, out } = timeline(t, meta.duration);
  if (!out && cin >= 1) return fill(p, ink);
  if (out && cout >= 1) return;
  const s = Math.max(6, o.cell | 0), cols = Math.ceil(W / s), rows = Math.ceil(H / s);
  const rim = C[n - 2], mid = C[Math.max(0, n - 4)];
  // each diamond's radius (L1, in px): it swells to s, which closes every gap, when the sweep reaches it
  const R = new Float32Array((cols + 2) * (rows + 2));
  for (let j = -1; j <= rows; j++)
    for (let i = -1; i <= cols; i++) {
      const cx = (i + 0.5) * s, cy = (j + 0.5) * s;
      const d = 0.62 * (cx / W) * 0.8 + 0.62 * (cy / H) * 0.2; // left to right, a little top-down
      const g = out ? seg(cout, d, d + 0.38) : seg(cin, d, d + 0.38);
      R[(j + 1) * (cols + 2) + i + 1] = out ? s * 1.02 * (1 - ease.inCubic(g)) : s * 1.02 * ease.outCubic(g);
    }
  screen(p, (x, y) => {
    const i0 = Math.floor(x / s), j0 = Math.floor(y / s);
    let best = -1e9, br = 0;
    for (let j = j0 - 1; j <= j0 + 1; j++)
      for (let i = i0 - 1; i <= i0 + 1; i++) {
        const r = R[(j + 1) * (cols + 2) + i + 1];
        if (r <= 0) continue;
        const depth = r - Math.abs(x - (i + 0.5) * s) - Math.abs(y - (j + 0.5) * s);
        if (depth > best) (best = depth), (br = r);
      }
    if (best <= 0) return;
    // a bright rim on diamonds still on the move; a settled diamond is plain cover
    const moving = br < s * 0.98;
    if (moving && best < 1.2) return rim;
    if (moving && best < 2.4) return mid;
    return ink;
  });
}
