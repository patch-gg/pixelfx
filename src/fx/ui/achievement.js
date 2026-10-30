import { PAL, RAMP, seg, ease, bump, WHITE } from "../../core/index.js";
import { Layer, boldText, twinkle, fit } from "./_lib.js";

export const meta = {
  name: "Achievement",
  desc: "An achievement toast slides in from the right edge with a bump: a gold medal on a ribbon, ACHIEVEMENT UNLOCKED, a shine sweeping across, then it slides away.",
  tags: ["ui", "achievement", "unlock", "toast", "reward", "text", "one-shot"],
  size: [100, 40],
  origin: [50, 20],
  duration: 2.2,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.arcane, title: "ACHIEVEMENT", text: "UNLOCKED", seed: 7 },
};

const L = new Layer(104, 40);
const GOLD = RAMP.gold, STAR = ["..a..", ".aba.", "aabaa", ".a.a."];
const PW = 44, PH = 12; // panel half-width, half-height

export function draw(p, t, o) {
  const C = fit(o.palette);
  // slide in from the right edge with a bump, out again at the end
  const inK = ease.outBack(seg(t, 0, 0.32), 1.2), outK = ease.inBack(seg(t, 1.85, 2.15), 1.4);
  const x = Math.round(100 * (1 - inK) + 100 * outK);
  if (x >= 98) return;
  const q = L.begin(-52, -20);
  // the panel: a rounded plate, a lit border, a darker lower half
  for (let y = -PH; y <= PH; y++)
    for (let xx = -PW; xx <= PW; xx++) {
      const corner = (Math.abs(y) === PH && Math.abs(xx) >= PW - 1) || (Math.abs(y) === PH - 1 && Math.abs(xx) === PW);
      if (corner) continue;
      const edge = Math.abs(y) === PH || Math.abs(xx) === PW || (Math.abs(y) === PH - 1 && Math.abs(xx) === PW - 1);
      q.px(xx, y, edge ? (y < 0 ? C[5] : C[4]) : y === -PH + 1 ? C[3] : y > 4 ? C[1] : C[2]);
    }
  // the medal: ribbon tails behind a gold disc with a star
  const mx = -PW + 13;
  q.poly([[mx - 5, 1], [mx - 1, 1], [mx - 2, 11], [mx - 4, 9], [mx - 6, 11]], C[5]);
  q.poly([[mx + 1, 1], [mx + 5, 1], [mx + 6, 11], [mx + 4, 9], [mx + 2, 11]], C[4]);
  q.circle(mx, -2, 8.5, GOLD[1]);
  q.circle(mx, -2, 7.5, (d, a) => (d > 0.8 ? (Math.sin(a) < 0 && Math.cos(a) < 0.6 ? GOLD[6] : GOLD[4]) : d > 0.64 ? GOLD[3] : GOLD[5]));
  q.sprite(STAR, { a: GOLD[6], b: WHITE }, mx - 2, -4);
  // the words
  q.text(o.title, mx + 12, -8, C[6], { font: "mini" });
  boldText(q, o.text, mx + 12, -1, (gx, gy) => (gy < 3 ? WHITE : C[7] ?? WHITE), { outline: C[0], align: "left" });
  L.outline(C[0]);
  // a shine sweeps across the plate once it has landed
  const sk = seg(t, 0.55, 0.95);
  if (sk > 0 && sk < 1) {
    const s = -PW - 12 + (PW * 2 + 24) * ease.inOutSine(sk);
    L.map((px, py, c) => {
      if (c === C[0]) return c;
      const d = px + 0.5 - (py + 0.5) * 0.6 - s;
      return Math.abs(d) < 1.2 ? WHITE : Math.abs(d) < 2.4 || Math.abs(d + 5) < 0.8 ? (c === WHITE ? c : C[6]) : c;
    });
  }
  L.draw(p, x, 0, 1, [-50, 50]);
  // the medal glints and the plate glows as it lands
  const g = bump(t, 0.95, 1.25);
  if (g > 0 && x === 0) twinkle(p, mx + 5, -8, Math.round(1 + g * 3), GOLD[5], GOLD[6]);
  p.glow(x, 0, 52, C[4], 0.22 * bump(t, 0.2, 0.9));
}
