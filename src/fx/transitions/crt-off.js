import { hex, ease, seg, WHITE } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "CRT off",
  desc: "A tube TV switching off: the picture squeezes into a glowing line, the line into a dot, the dot dies; then it all flicks back on.",
  tags: ["crt", "tv", "retro", "power"],
  duration: 1.5,
  options: { palette: ["#0c2230", "#1a4c5c", "#3a8ea0", "#86d8e6", "#d4fbff", "#ffffff"] },
});

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), n = C.length;
  const { cin, cout, out } = timeline(t, meta.duration);
  const cy = H / 2, cx = W / 2;
  // q runs the shut-down 0..1; the switch-on plays it back faster at the start and slower at the end
  let hh, hw, dot, glowK;
  if (!out) {
    hh = (H / 2) * (1 - ease.inQuart(seg(cin, 0, 0.5))); // picture height squeezes
    hw = (W / 2) * (1 - ease.inCubic(seg(cin, 0.5, 0.78))); // then the line shortens
    dot = 1 - seg(cin, 0.78, 1); // then the dot fades
    glowK = seg(cin, 0.25, 0.5) ** 2;
  } else {
    dot = seg(cout, 0, 0.12);
    hw = (W / 2) * ease.outCubic(seg(cout, 0.1, 0.32));
    hh = (H / 2) * ease.outCubic(seg(cout, 0.32, 0.75));
    glowK = (1 - seg(cout, 0.32, 0.7)) ** 2;
  }
  if (hh >= H / 2 && hw >= W / 2) return;
  if (dot <= 0) return fill(p, ink);
  const rim = C[n - 2], mid = C[Math.max(0, n - 4)];
  if (hh > 1) {
    // the picture: a window over the scene, brightening as it squeezes, with lit edges
    screen(p, (x, y, o2) => {
      const dy = Math.abs(y - cy) - hh;
      if (dy < -1) {
        o2.l = C[n - 3];
        o2.k = 0.55 * glowK * (1 - Math.abs(y - cy) / (hh + 1)) + 0.2 * glowK;
        return;
      }
      if (dy < 0) return rim;
      if (dy < 1 && glowK > 0.3) return mid;
      return ink;
    });
    return;
  }
  // the line, then the dot: hot white on black, with a soft glow
  fill(p, ink);
  if (hw > 1.5) {
    p.rect(cx - hw, cy - 1, hw * 2, 2, WHITE);
    p.rect(cx - hw * 0.8, cy - 2, hw * 1.6, 1, rim);
    p.rect(cx - hw * 0.8, cy + 1, hw * 1.6, 1, rim);
    p.glowLine(cx - hw * 0.85, cy, cx + hw * 0.85, cy, 10, C[n - 3], 0.3);
    p.glow(cx, cy, Math.min(30, hw * 0.4 + 6), C[n - 2], 0.25);
  } else {
    const s = dot > 0.5 ? 2 : 1;
    p.rect(cx - s, cy - s, s * 2, s * 2, WHITE, Math.min(1, dot * 1.6));
    p.glow(cx, cy, 6 + 8 * dot, C[n - 3], 0.5 * dot);
  }
}
