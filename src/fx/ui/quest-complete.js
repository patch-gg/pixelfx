import { PAL, RAMP, seg, ease, bump, WHITE, hex } from "../../core/index.js";
import { Layer, boldText, letters, twinkle, shake, fit } from "./_lib.js";

export const meta = {
  name: "Quest complete",
  desc: "A ribbon banner unrolls from the middle, QUEST COMPLETE types on, a gold seal with a check stamps down with a jolt, three stars pop; then it rolls back up.",
  tags: ["ui", "quest", "complete", "banner", "reward", "text", "one-shot"],
  size: [144, 60],
  origin: [72, 34],
  duration: 2.4,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.water, text: "QUEST COMPLETE", seed: 6 },
};

const L = new Layer(128, 40);
const GOLD = RAMP.gold, CREAM = hex("#f4ecd0");
const STAR = ["..a..", ".aba.", "abbba", ".aba.", "a...a"];
const BIG_STAR = ["....a....", "....a....", "...aba...", "aaabbbaaa", ".abbcbba.", "..abbba..", "..abbba..", ".aba.aba.", ".a.....a."];

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, str = o.text;
  const tw = p.measure(str, { font: "big" })[0], HW = Math.ceil(tw / 2) + 14, TX = 8; // the text sits right of the seal
  // unroll from the middle with an overshoot; roll back up at the end
  const open = ease.outBack(seg(t, 0, 0.3), 1.3) * (1 - ease.inBack(seg(t, 2.0, 2.3), 1.5));
  if (open <= 0.02 && t > 0.3) return;
  const hw = Math.max(1, Math.round(HW * open)), [jx, jy] = shake(t, 2, 0.62, 0.22, S);
  const q = L.begin(-64, -20);
  // the tails: notched ends behind the band, sliding out once it is open
  const tail = Math.round(10 * ease.outCubic(seg(t, 0.26, 0.4)) * (1 - seg(t, 1.95, 2.05)));
  if (tail > 1)
    for (const s of [-1, 1])
      for (let i = 0; i <= tail; i++)
        for (let y = -3; y <= 10; y++) {
          const x = s * (hw - 3 + i);
          if ((i === tail && Math.abs(y - 3.5) < 3) || (i === tail - 1 && Math.abs(y - 3.5) < 1.5)) continue; // the V notch
          q.px(x, y, i < 3 && y > 5 ? C[1] : y < -1 ? C[4] : y > 8 ? C[2] : C[3]);
        }
  // the band: lit top edge, stitching, shaded bottom
  for (let y = -8; y <= 6; y++)
    for (let x = -hw; x < hw; x++) {
      let c = y === -8 ? C[6] : y < -5 ? C[5] : y > 4 ? C[2] : y > 2 ? C[3] : C[4];
      if ((y === -6 || y === 4) && x % 3 === 0 && Math.abs(x) < hw - 2) c = y < 0 ? C[6] : C[4];
      q.px(x, y, c);
    }
  L.outline(C[0]);
  L.draw(p, jx, jy);
  // the words type on, each letter dropping in white then settling cream
  const { list } = letters(p, str);
  if (t < 1.98)
    list.forEach(({ ch, x }, i) => {
      const k = seg(t, 0.3 + i * 0.022, 0.42 + i * 0.022);
      if (k <= 0 || ch === " ") return;
      const lx = TX + x - Math.round(tw / 2), dy = Math.round(-4 * (1 - ease.outBack(k, 2)));
      if (Math.abs(lx) > hw - 4) return;
      boldText(p, ch, lx + jx, -5 + dy + jy, k < 0.6 ? WHITE : (gx, gy) => (gy < 3 ? WHITE : CREAM), { outline: C[0], shadow: C[1], align: "left" });
    });
  // the seal stamps down on the left end: big, then thump
  const sk = seg(t, 0.55, 0.65);
  if (sk > 0 && t < 2.02) {
    const sx = -Math.round(HW * open) + 9 + jx, sy = -1 + jy, r = 9 + Math.round(5 * (1 - ease.outQuad(sk)));
    p.circle(sx, sy, r + 1, GOLD[1]);
    p.circle(sx, sy, r, (d, a) => (d > 0.78 ? (Math.sin(a) < -0.2 || Math.cos(a) < -0.5 ? GOLD[6] : GOLD[4]) : d > 0.62 ? GOLD[3] : GOLD[5]));
    // the check
    const k = r / 9;
    p.beam(sx - 4 * k, sy, sx - 1.5 * k, sy + 3 * k, 2.2 * k, GOLD[1]);
    p.beam(sx - 1.5 * k, sy + 3 * k, sx + 4.5 * k, sy - 4 * k, 2.2 * k, GOLD[1]);
    if (sk < 1) p.ring(sx, sy, r + 3 + 6 * sk, 1, WHITE, 1 - sk);
  }
  // three stars pop over it, the middle one biggest
  for (let i = 0; i < 3; i++) {
    const k = seg(t, 0.75 + i * 0.1, 0.95 + i * 0.1), out = seg(t, 1.9, 2.0);
    if (k <= 0 || out >= 1) continue;
    const x = TX + (i - 1) * 16 + jx, y = (i === 1 ? -19 : -15) + jy - Math.round(3 * bump(k, 0, 0.6));
    const c = { a: GOLD[4], b: k < 0.4 ? WHITE : GOLD[6], c: WHITE };
    if (i === 1) p.sprite(BIG_STAR, c, x - 4, y - 4);
    else p.sprite(STAR, c, x - 2, y - 2);
    const tk = bump(t, 1.2 + i * 0.15, 1.45 + i * 0.15);
    if (tk > 0) twinkle(p, x + (i === 1 ? 5 : 3), y - (i === 1 ? 4 : 3), Math.round(1 + tk * 2), GOLD[5], GOLD[6]);
    p.light(x, y, GOLD[5], 0.35);
  }
  p.glow(0, -1, 60, C[4], 0.14 * bump(t, 0, 2.2));
}
