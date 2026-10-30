import { PAL, fit, at, burst, cycle, seg, ease, bump, clamp, TAU, WHITE, hex } from "../../core/index.js";

export const meta = {
  name: "Level up",
  desc: "A golden pillar bursts from the feet, LEVEL UP! drops in letter by letter with a bounce, stars pop, motes rise.",
  tags: ["ui", "feedback", "level", "reward", "text", "one-shot"],
  size: [96, 80],
  origin: [48, 66],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.gold, text: "LEVEL UP!", seed: 5 },
};

const OUTLINE = hex("#2a1406");

export function draw(p, t, o) {
  const G = fit(o.palette, 8), S = o.seed, out = 1 - seg(t, 1.45, 1.8);
  // pillar of light: snaps up, then narrows away
  const pil = seg(t, 0, 0.12), shrink = seg(t, 0.3, 0.9);
  if (pil > 0 && shrink < 1) {
    const w = 9 * (1 - ease.inQuad(shrink)), top = -62 * ease.outCubic(pil);
    p.shade(-w, top, w, 0, (x, y, o2) => {
      const v = Math.abs(x) / w;
      if (v > 1) return;
      o2.c = v < 0.4 ? WHITE : v < 0.75 ? G[6] : G[5];
      o2.a = clamp((y - top) / 16) * (v < 0.75 ? 1 : 0.6);
    });
    p.glowLine(0, top, 0, 0, 14, G[5], 0.5 * (1 - shrink));
  }
  // ground ring at the feet
  const ring = seg(t, 0.02, 0.5);
  if (ring > 0 && ring < 1) p.ellipse(0, 0, 4 + 22 * ease.outCubic(ring), 2 + 5 * ease.outCubic(ring), G[6], (d) => (d > 0.75 ? 1 - ring : 0));
  // rising motes
  cycle(t, 1.8, 14, S, 0.9, (age, life, r) => {
    if (t > 1.5) return;
    const k = age / life, x = r.range(-16, 16), y = -age * r.range(30, 55);
    p.px(x + Math.sin(age * 6 + r.next() * 6), y, k < 0.5 ? G[7] : G[5]);
    p.light(x, y, G[5], 0.4 * (1 - k));
  });
  // the words: each letter drops in with an overshoot, then all float up and dissolve
  const str = o.text, y0 = -42 - 6 * ease.inQuad(seg(t, 1.35, 1.8));
  const total = p.measure(str, { font: "big" })[0];
  let x = -Math.round(total / 2);
  [...str].forEach((ch, i) => {
    const w = p.measure(ch, { font: "big" })[0], born = 0.1 + i * 0.045, k = seg(t, born, born + 0.22);
    if (k > 0) {
      const dy = -10 * (1 - ease.outBack(k, 2.6));
      p.text(ch, x, y0 + dy, (gx, gy) => (gy < 2 ? WHITE : gy < 5 ? G[5] : G[4]), { font: "big", outline: OUTLINE, a: out });
    }
    x += w + 1;
  });
  // stars pop around the words
  burst(6, S + 1, (r, i) => {
    const born = 0.35 + i * 0.12, k = seg(t, born, born + 0.35);
    if (k <= 0 || k >= 1) return;
    const sx = r.range(-34, 34), sy = r.range(-58, -30), s = Math.round(3 * bump(k, 0, 1));
    p.line(sx - s, sy, sx + s, sy, G[6]);
    p.line(sx, sy - s, sx, sy + s, G[6]);
    p.px(sx, sy, WHITE);
    p.light(sx, sy, G[5], 0.5 * bump(k, 0, 1));
  });
  p.glow(0, -30, 46, G[4], 0.3 * bump(t, 0, 1.4));
}
