import { PAL, cycle, fract, ease, clamp, TAU, WHITE } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Spell charge",
  desc: "Energy gathers at a point: motes spiral in, dashed rings collapse onto a throbbing orb that swells as each one lands.",
  tags: ["arcane", "charge", "magic", "buildup", "loop"],
  size: [56, 56],
  origin: [28, 28],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.arcane, radius: 24, seed: 8 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), D = meta.duration, ph = t / D, R = o.radius, S = o.seed;
  // rings: four a loop (two at a time), three dashes each, turning as they fall in faster and faster;
  // the dashes lengthen as they close, so each ring reads as one shape tightening rather than a spray of dots
  let pulse = 0;
  for (let j = 0; j < 2; j++) {
    const q = fract(ph * 2 + j * 0.5), e = ease.inQuad(q);
    const r = 6 + (R - 6) * (1 - e), rot = (j ? 1.3 : 0) + ph * TAU * (j ? -1 : 1) + e * 2.5;
    pulse = Math.max(pulse, Math.exp(-q * 8));
    const cut = 0.95 - 0.9 * Math.sqrt(q);
    p.ring(0, 0, r, 1, e < 0.3 ? C[4] : e < 0.7 ? C[5] : C[6], (v, ang) => (Math.sin(ang * 3 + rot) > cut ? 1 : 0));
  }
  // motes: drawn in from the dark, spinning faster as they fall, streaking at the end
  cycle(t, D, 10, S, (r) => r.range(0.5, 0.8), (age, life, r) => {
    const k = age / life, e = ease.inQuad(k), a0 = r.range(0, TAU), R0 = r.range(R * 0.7, R * 1.05);
    const pos = (ee) => {
      const ang = a0 + ee * 2.2, rad = R0 * (1 - ee) + 3 * ee;
      return [Math.cos(ang) * rad, Math.sin(ang) * rad];
    };
    const [x, y] = pos(e), [bx, by] = pos(ease.inQuad(Math.max(0, k - 0.12)));
    const c = k < 0.35 ? C[4] : k < 0.75 ? C[5] : C[6];
    if (k > 0.5) p.line(bx, by, x, y, c);
    else p.dot(x, y, c, clamp(k * 5));
    if (k > 0.7) p.light(x, y, C[5], 0.35);
  });
  // the orb: a hard-edged ball with a white heart that swells and flashes as each ring lands
  const breathe = 0.5 + 0.5 * Math.sin(ph * TAU * 4);
  const rO = 3.4 + 1.6 * pulse + 0.4 * breathe;
  p.circle(0, 0, rO + 1, pulse > 0.7 ? C[6] : C[3]);
  p.circle(0, 0, rO, (d, ang) => {
    const lit = d * Math.cos(ang + 2.4); // lit from the top left
    return d < 0.32 + 0.2 * pulse ? WHITE : d < 0.6 || lit > 0.45 ? C[6] : d < 0.86 ? C[5] : C[4];
  });
  p.glow(0, 0, R + 6, C[4], 0.16 + 0.1 * pulse);
  p.glow(0, 0, 7, C[5], 0.25 + 0.25 * pulse);
}
