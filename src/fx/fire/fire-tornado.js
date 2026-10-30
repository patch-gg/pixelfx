import { PAL, RAMP, ramp, at, clamp, tileFbm, rng, wrap, TAU, WHITE } from "../../core/index.js";
import { fit, pool } from "./_lib.js";

export const meta = {
  name: "Fire tornado",
  desc: "A spinning column of fire: a funnel narrow at the ground and wide at the top, bright bands spiralling round it, embers orbiting, a swirl at its foot.",
  tags: ["fire", "tornado", "vortex", "hazard", "spell", "loop"],
  size: [64, 108],
  origin: [32, 102],
  duration: 1,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.fire, height: 86, seed: 10 },
};

export function draw(p, t, o) {
  const F = fit(ramp(o.palette)), DU = RAMP.dust, S = o.seed, D = meta.duration, ph = t / D, H = o.height;
  const FIRE = [F[2], F[3], F[4], F[5], F[6], F[7]];
  const axis = (v) => Math.sin(v * 3.2 - ph * TAU) * 3 * v + Math.sin(v * 1.3 + ph * TAU) * 1.5 * v;
  const width = (v) => 2.5 + 15 * Math.pow(v, 1.5);
  // orbiting embers and grit: each circles the funnel and climbs, behind it on the far side
  const orbit = (front) => {
    for (let i = 0; i < 16; i++) {
      const r = rng(S + 3, i), v = wrap(r.next() + ph, 1), a = r.range(0, TAU) + ph * TAU * 2 * (1 + (i % 2));
      if (Math.sin(a) >= 0 !== front) continue;
      const x = axis(v) + Math.cos(a) * (width(v) + 3), y = -v * H + Math.sin(a) * 2;
      const ember = i % 3 !== 0;
      p.px(x, y, ember ? (front ? F[6] : F[4]) : front ? DU[4] : DU[2]);
      if (!ember) p.px(x + 1, y, front ? DU[3] : DU[1]);
      if (ember && front) p.light(x, y, F[5], 0.4);
    }
  };
  orbit(false);
  // the funnel: bands of heat spiral round it, so it reads as turning
  p.shade(-22, -H - 6, 22, 1, (x, y) => {
    const v = -y / H;
    if (v < 0 || v > 1.05) return;
    const W = width(v), u = (x - axis(v)) / W;
    if (Math.abs(u) > 1.2) return;
    // bright and dark bands wrap round the funnel and slide sideways, so it spins
    const th = Math.asin(clamp(u, -1, 1));
    const band = Math.sin(th * 2.4 + y * 0.38 + ph * TAU * 3);
    const n = tileFbm(x * 0.3, y * 0.2 + ph * 10, 0, 10, S, 2);
    const heat = (1 - u * u) * 0.55 + band * 0.36 + n * 0.22 + 0.3 - v * 0.3 - Math.max(0, v - 0.92) * 4;
    if (heat < 0.14) return;
    return heat > 1.02 ? WHITE : at(FIRE, heat);
  });
  orbit(true);
  // a ring of flame and grit swirling at its foot
  for (let i = 0; i < 22; i++) {
    const r = rng(S + 5, i), a = r.range(0, TAU) + ph * TAU * 2, rad = r.range(5, 12);
    const x = Math.cos(a) * rad, y = Math.sin(a) * rad * 0.25 - 1;
    p.px(x, y, i % 3 ? (Math.sin(a) > 0 ? F[5] : F[3]) : DU[3]);
  }
  pool(p, 0, 0, 22, 4, F[4], 0.35);
  p.glowLine(axis(0.2), -H * 0.2, axis(0.8), -H * 0.8, 26, F[4], 0.28);
}
