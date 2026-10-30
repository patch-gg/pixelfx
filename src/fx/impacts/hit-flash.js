import { PAL, ramp, burst, seg, ease, WHITE } from "../../core/index.js";

export const meta = {
  name: "Hit flash",
  desc: "Taking damage: the body flashes solid white, then red, blinks white once more and cools off, while comic hit lines jab in at it.",
  tags: ["impact", "hit", "damage", "flash", "status", "actor", "one-shot"],
  size: [40, 36],
  origin: [20, 30],
  duration: 0.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.blood, lines: 6, seed: 17 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, N = C.length - 1, a = o.actor, m = a.mask;
  const f = Math.floor(t * meta.fps + 1e-6); // the flashes are frame-exact, like a game's damage blink
  // the body: white, white, red, red, white rim, then a red rim cooling away
  const red = (mx, my) => (my < m.h * 0.45 ? C[N - 1] : C[N - 2]);
  if (f <= 1) p.mask(m, a.x, a.y, WHITE);
  else if (f <= 3) {
    p.mask(m, a.x, a.y, red);
    p.outline(m, a.x, a.y, C[N - 4]);
  } else if (f === 4) p.outline(m, a.x, a.y, WHITE);
  else if (f <= 6) p.outline(m, a.x, a.y, C[N - 1]);
  else if (f <= 8) p.outline(m, a.x, a.y, C[N - 3]);
  // hit lines: short strokes around the body, jabbing in toward it, gone in a few frames
  const k = seg(t, 0, 0.16);
  if (k < 1) {
    const [cx, cy] = a.chest;
    burst(o.lines, S, (r, i) => {
      // spread over the top and sides of the body, never down into the floor
      const ang = -Math.PI - 0.35 + ((i + r.range(0.2, 0.8)) / o.lines) * (Math.PI + 0.7);
      const d0 = r.range(10, 13) - 3 * ease.outCubic(k), len = r.range(4, 6) * (1 - k);
      if (len < 1) return;
      const dx = Math.cos(ang), dy = Math.sin(ang) * 1.1;
      p.line(cx + dx * (d0 + len), cy + dy * (d0 + len), cx + dx * d0, cy + dy * d0, (u) => (u > 0.5 ? WHITE : C[N]));
    });
  }
  const L = 1 - seg(t, 0, 0.2);
  p.glow(a.chest[0], a.chest[1], 18, f <= 1 ? WHITE : C[N - 1], 0.25 * L * L);
}
