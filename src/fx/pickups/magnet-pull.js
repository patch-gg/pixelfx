import { PAL, RAMP, cycle, ease, bump, TAU, WHITE } from "../../core/index.js";
import { Layer, fit } from "./_lib.js";

export const meta = {
  name: "Magnet pull",
  desc: "A horseshoe magnet facing right hauls in sparks and tumbling coins: they curve in from a wide fan, speeding up, and flash into the gap between its poles.",
  tags: ["pickup", "magnet", "power-up", "attract", "directional", "loop"],
  size: [68, 48],
  origin: [26, 24],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.electric, count: 20, seed: 13 },
};

const L = new Layer(28, 24);
const RED = RAMP.blood, STEEL = RAMP.metal, GOLD = RAMP.gold;

// the magnet: a thick red U opening to the right, steel pole tips, lit from the top; it shudders a pixel on the beat
function magnet(p, kick) {
  const q = L.begin(-24, -12);
  q.place(-kick, 0);
  q.arc(-12, 0, 8, 4, Math.PI * 0.5, Math.PI * 1.5, (u, v) => (u < 0.22 ? RED[4] : u < 0.62 ? (v > 0.55 ? RED[6] : RED[5]) : u < 0.85 ? RED[4] : RED[3]));
  for (let x = -12; x < -4; x++) {
    q.px(x, -8, RED[6]), q.px(x, -7, RED[5]), q.px(x, -6, RED[5]), q.px(x, -5, RED[3]);
    q.px(x, 4, RED[5]), q.px(x, 5, RED[4]), q.px(x, 6, RED[3]), q.px(x, 7, RED[2]);
  }
  for (let x = -4; x < -1; x++) {
    q.px(x, -8, STEEL[7]), q.px(x, -7, STEEL[6]), q.px(x, -6, STEEL[5]), q.px(x, -5, STEEL[3]);
    q.px(x, 4, STEEL[6]), q.px(x, 5, STEEL[5]), q.px(x, 6, STEEL[4]), q.px(x, 7, STEEL[3]);
  }
  L.outline(RED[1]);
  L.draw(p);
}

export function draw(p, t, o) {
  const C = fit(o.palette), D = meta.duration;
  let land = 0;
  // the field: a soft cone of light in front of the poles, breathing with the pull
  p.glowLine(0, 0, 26, 0, 13, C[3], 0.1 + 0.04 * Math.sin((t / D) * TAU * 2));
  // sparks: born on a wide fan to the right, spiralling in to the gap, faster and faster
  cycle(t, D, o.count, o.seed, (r) => r.range(0.5, 0.8), (age, life, r, i) => {
    const k = age / life, a0 = ((i + r.range(0.1, 0.9)) / o.count - 0.5) * 2.7, R0 = r.range(22, 34), turn = r.range(0.3, 0.7) * Math.sign(a0 || 1);
    const at = (q) => {
      const e = ease.inQuad(q), rad = R0 * (1 - e), a = a0 * (1 - e) + turn * Math.sin(e * Math.PI);
      return [Math.cos(a) * rad, Math.sin(a) * rad * 0.7];
    };
    const [x, y] = at(k), [tx, ty] = at(Math.max(0, k - 0.14));
    if (k > 0.9) land = Math.max(land, (k - 0.9) / 0.1);
    const kind = i % 4;
    if (kind === 0) {
      // a coin tumbling in, flat then edge-on
      const edge = Math.floor(age * 16) % 2;
      p.rect(Math.round(x) - 1, Math.round(y) - 1, edge ? 1 : 2, 2, GOLD[5]);
      p.px(Math.round(x) - 1, Math.round(y) - 1, GOLD[6]);
    } else {
      if (k > 0.25) p.line(tx, ty, x, y, (u) => (u > 0.55 ? C[4] : C[2]));
      p.px(x, y, k > 0.7 ? WHITE : C[5]);
    }
    p.light(x, y, C[4], 0.25 + 0.35 * k);
  });
  const kick = bump((t / D) * 4 % 1, 0, 0.3) > 0.5 ? 1 : 0;
  magnet(p, kick);
  // the gap glows, flaring as sparks land
  const fl = 0.5 + 0.5 * Math.sin((t / D) * TAU * 4);
  p.glow(0, 0, 10, C[4], 0.25 + 0.2 * fl);
  p.glow(0, 0, 3, C[6], 0.3 + 0.3 * land);
  p.glow(-8, 0, 26, C[3], 0.1);
}
