import { PAL, hex, burst, seg, ease, WHITE } from "../../core/index.js";
import { Layer, fit } from "./_lib.js";

export const meta = {
  name: "Button press",
  desc: "A cursor glides onto a chunky PLAY button and clicks: the face sinks into its lip and flashes, ripples run out from its edges, then it springs back up.",
  tags: ["ui", "button", "click", "press", "menu", "one-shot"],
  size: [72, 48],
  origin: [36, 22],
  duration: 1.4,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.leaf, text: "PLAY", seed: 8 },
};

const L = new Layer(80, 48);
const HW = 18, HH = 6, LIP = 3; // face half-width, half-height, lip depth
const CURSOR = ["k.......", "kk......", "kwk.....", "kwwk....", "kwwwk...", "kwwwwk..", "kwwwwwk.", "kwwkkkkk", "kwk.....", "kk......", "k......."];
const INK = hex("#0b0a10");
const PRESS = 0.42, RELEASE = 0.58;

// signed distance to a rounded box of half-size (hw, hh), corner radius r
function box(x, y, hw, hh, r) {
  const qx = Math.abs(x) - hw + r, qy = Math.abs(y) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, fade = 1 - seg(t, 1.15, 1.38);
  if (fade <= 0) return;
  // the press: down hard, then up with a little overshoot
  const down = t < PRESS ? 0 : t < RELEASE ? LIP - 1 : Math.round(-1 * Math.sin(seg(t, RELEASE, RELEASE + 0.12) * Math.PI));
  const flash = t >= PRESS && t < PRESS + 0.07;
  const q = L.begin(-40, -24);
  // the lip (the button's side), then the face on top of it, sunk by `down`
  L.fill(-HW - 1, -HH + 1, HW + 1, HH + LIP + 1, (x, y) => (box(x, y - LIP, HW, HH, 3) < 0 ? (y > HH + LIP - 1.5 ? C[1] : C[2]) : 0));
  L.fill(-HW - 1, -HH - 1 + down, HW + 1, HH + 1 + down, (x, y) => {
    const d = box(x, y - down, HW, HH, 3);
    if (d >= 0) return 0;
    if (flash) return d > -1 ? WHITE : C[6];
    const yy = y - down;
    return d > -1 ? (yy < 0 ? C[6] : C[4]) : yy < -HH + 2 ? C[5] : down > 0 ? C[3] : C[4];
  });
  q.text(o.text, 0, -3 + down + 1, INK, { font: "big", align: "center" });
  q.text(o.text, 0, -3 + down, flash ? C[3] : WHITE, { font: "big", align: "center" });
  L.outline(C[0]);
  L.draw(p, 0, 0, fade);
  // ripples run out from its edges, two of them
  for (let i = 0; i < 2; i++) {
    const k = seg(t, PRESS + i * 0.08, PRESS + 0.4 + i * 0.08);
    if (k <= 0 || k >= 1) continue;
    const R = 2 + 12 * ease.outCubic(k);
    p.shade(-HW - 16, -HH - 16, HW + 16, HH + LIP + 16, (x, y, out) => {
      if (Math.abs(box(x, y - 1, HW, HH + 1, 4) - R) > 0.55) return;
      out.c = k < 0.4 ? C[6] : C[5 - i];
      out.a = (k < 0.6 ? 1 : 0.5) * fade;
    });
  }
  // sparks off the corners
  burst(4, S, (r, i) => {
    const k = seg(t, PRESS, PRESS + 0.3);
    if (k <= 0 || k >= 1) return;
    const sx = i % 2 ? 1 : -1, sy = i < 2 ? -1 : 1, d = 4 + 8 * ease.outCubic(k);
    const x = sx * (HW + d), y = sy * (HH + d * 0.6) + 1;
    p.line(x - sx * 2 * (1 - k), y - sy * 1.2 * (1 - k), x, y, C[6]);
  });
  // the cursor glides in from the lower right, dips on the click
  const ck = ease.outCubic(seg(t, 0, 0.36)), dip = t >= PRESS - 0.04 && t < RELEASE ? 1 : 0;
  const cx = Math.round(26 - 18 * ck), cy = Math.round(13 - 11 * ck + dip + Math.max(0, down));
  p.sprite(CURSOR, { k: INK, w: WHITE }, cx, cy, { a: fade * (1 - seg(t, 0.95, 1.15)) });
  p.glow(0, 1, 30, C[4], (flash ? 0.5 : 0.12) * fade);
}
