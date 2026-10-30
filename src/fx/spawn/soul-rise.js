import { ramp, at, cycle, stream, seg, ease, bump, stockActor, TAU, WHITE } from "../../core/index.js";
import { actorOf, stretchMask } from "./_lib.js";

export const meta = {
  name: "Soul rise",
  desc: "The body's outline flares as a pale copy of it lifts out, legs trailing off into a rippling wisp, sways as it climbs and thins away into motes.",
  tags: ["spawn", "death", "soul", "spirit", "ghost", "one-shot"],
  size: [48, 80],
  origin: [24, 74],
  duration: 2.1,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#14203a", "#24406a", "#3c6aa4", "#64a0d8", "#9cd0f4", "#d8f4ff", "#ffffff"], height: 40, seed: 27 },
};

// the stock character's eyes, in mask coordinates: the soul keeps them as hollows
const EYES = new Set(["4,5", "4,6", "7,5", "7,6"]);

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, a = actorOf(o), m = a.mask, stock = m === stockActor().mask;
  // the body gives up its light: an outline that flares and dies away
  const shine = bump(t, 0, 0.55);
  if (shine > 0.05) p.outline(m, a.x, a.y, shine > 0.5 ? WHITE : at(C, 0.75), Math.min(1, shine * 1.5));
  // the soul: lifts out, stretching tall and thin, its legs trailing into a wisp
  const u = seg(t, 0.1, 1.8), lift = ease.inOutSine(u), fade = 1 - seg(t, 1.2, 1.75);
  const yb = -lift * o.height, sway = Math.sin(t * 3.4) * 3 * seg(t, 0.15, 0.6), sx = 1 - 0.15 * lift, sy = 1 + 0.25 * lift;
  const waist = Math.round(m.h * 0.62), legs = m.h - waist, wisp = seg(t, 0.1, 0.5);
  if (fade > 0)
    stretchMask(p, a, sway, yb, sx, sy, (mx, my, edge, out) => {
      let alpha = 1;
      if (my >= waist) {
        // below the waist the legs melt into a tapering wisp that ripples
        const k = (my - waist + 1) / legs, w = (1 - k * wisp) * m.w * 0.5 - k * wisp * 0.5, c = m.w / 2 + Math.sin(my * 0.9 - t * 9) * 1.5 * k * wisp;
        if (Math.abs(mx + 0.5 - c) > w) return;
        alpha = 1 - k * wisp * 0.55;
      }
      out.a = fade * alpha;
      if (stock && EYES.has(`${mx},${my}`)) return C[1];
      if (edge) return at(C, 0.52);
      return my < 4 ? at(C, 0.92) : my < waist ? at(C, 0.8) : at(C, 0.66);
    });
  // motes: a few circling it on the way up, then the rest of it breaks into motes that rise and wink out
  const cx = sway, cy = yb - m.h * 0.5 * sy;
  cycle(t, meta.duration, 8, S, (r) => r.range(0.5, 0.8), (age, life, r) => {
    if (t < 0.2 || t > 1.5) return;
    const k = age / life, th = r.range(0, TAU) + age * 5, R = 9 - k * 3;
    p.px(cx + Math.cos(th) * R, cy + Math.sin(th) * R * 1.4 - age * 6, k < 0.5 ? at(C, 0.92) : at(C, 0.7));
  });
  stream(t, 1.15, 1.7, 40, S + 1, (r) => r.range(0.25, 0.4), (age, life, r, i) => {
    const t0 = 1.15 + i / 40, l0 = ease.inOutSine(seg(t0, 0.1, 1.8)), k = age / life;
    const x = Math.sin(t0 * 3.4) * 3 + r.range(-5, 5), y = -l0 * o.height - r.range(2, m.h * 1.2) - age * r.range(10, 22);
    if (k > 0.6 && Math.floor(age * 24) % 2) return;
    p.px(x, y, k < 0.4 ? WHITE : at(C, 0.75));
  });
  // light: a cold glow that travels with it
  p.glow(cx, cy, 22, at(C, 0.7), 0.3 * fade * seg(t, 0.05, 0.3));
}
