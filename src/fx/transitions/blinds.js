import { PAL, hex, ease, seg } from "../../core/index.js";
import { screenMeta, timeline, screen, fill, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Blinds",
  desc: "Venetian blinds tilt shut slat by slat from the top, light catching each slat's edge, then tilt open again from the bottom.",
  tags: ["blinds", "slats", "wipe"],
  duration: 1.4,
  options: { palette: PAL.dust, slats: 9 },
});

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), n = C.length, N = Math.max(2, o.slats | 0);
  const { cin, cout, out } = timeline(t, meta.duration);
  if (!out && cin >= 1) return fill(p, ink);
  if (out && cout >= 1) return;
  const sh = H / N, lit = C[n - 2], edge = C[Math.max(0, n - 4)], dim = C[Math.max(0, n - 6)], deep = C[0];
  // each slat turns about its middle: its face shows sin(angle) of its height. Top slats lead on the way
  // in, bottom slats on the way out; the light catches the edge that's turning toward it
  const tilt = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const d = (out ? N - 1 - i : i) / (N - 1) * 0.4;
    const g = seg(out ? cout : cin, d, d + 0.6);
    tilt[i] = out ? Math.cos(ease.inOutSine(g) * Math.PI / 2) : Math.sin(ease.inOutSine(g) * Math.PI / 2);
  }
  // the ladder cords show in the gaps between slats while any slat is open
  const cords = [Math.round(W * 0.16), Math.round(W * 0.84) - 1], ca = Math.min(1, (out ? 1 - cout : cin) * 5);
  screen(p, (x, y, o2) => {
    const i = Math.min(N - 1, Math.floor(y / sh)), mid = (i + 0.5) * sh, h = tilt[i] * sh / 2;
    const dy = y - mid;
    if (h < 0.25 || Math.abs(dy) > h + 0.01) {
      if (Math.floor(x) !== cords[0] && Math.floor(x) !== cords[1]) return;
      o2.a = ca;
      return dim;
    }
    const tl = tilt[i];
    if (tl > 0.97) return ink;
    // the leading lip glints; the face is lit while the slat is side-on and goes dark as it shuts
    const lip = out ? dy - (h - 1) : -h + 1 - dy; // >= 0 at the lit edge
    if (lip >= -0.01) return tl > 0.85 ? edge : lit;
    const face = tl < 0.45 ? edge : tl < 0.75 ? dim : tl < 0.9 ? deep : ink;
    if (out ? dy < -h + 1.5 : dy > h - 1.5) return tl < 0.75 ? deep : ink;
    return face;
  });
}
