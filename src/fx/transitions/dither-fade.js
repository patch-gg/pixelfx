import { PAL, hex, ease, clamp } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, bayer, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Dither fade",
  desc: "An old-console fade: chunky ordered dither creeps in from the corners through a deep tint, holds black, then clears from the middle out.",
  tags: ["fade", "dither", "retro"],
  duration: 1.4,
  options: { palette: PAL.arcane, cell: 2, vignette: 0.35, steps: [0] },
});

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color);
  const { cin, cout, out } = timeline(t, meta.duration);
  const k = out ? 1 - ease.inOutSine(cout) : ease.inOutSine(cin);
  if (k <= 0) return;
  if (k >= 1) return fill(p, ink);
  // the fade walks a short ladder of palette steps down to the cover, one full dither pass per rung
  const cs = Math.max(1, o.cell | 0), v = o.vignette, ladder = [...o.steps.map((i) => C[Math.min(i, C.length - 1)]), ink];
  const n = ladder.length;
  screen(p, (x, y) => {
    const th = bayer(Math.floor(x / cs), Math.floor(y / cs));
    const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
    // the corners lead and the middle lags; stretched so every pixel still reaches 0 and 1
    const kk = clamp(k * (1 + v) - v * (1 - Math.min(1, (dx * dx + dy * dy) * 0.5))) * n;
    const rung = Math.floor(kk), f = kk - rung;
    const i = f > th ? rung : rung - 1;
    if (i >= 0) return ladder[Math.min(i, n - 1)];
  });
}
