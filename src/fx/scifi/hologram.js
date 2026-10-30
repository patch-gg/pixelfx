import { ramp, cycle, rand, TAU, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Hologram",
  desc: "A floor projector throws a cone of light; in it a wireframe cube turns, cut by scanlines, a bright sweep running down it, glitching now and then.",
  tags: ["scifi", "hologram", "tech", "prop", "ground", "loop"],
  size: [48, 64],
  origin: [24, 60],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#061224", "#0c2a4e", "#154e86", "#2484c0", "#4cbce8", "#9ae6ff", "#e6fbff"], size: 7, seed: 21 },
};

const METAL = ramp(["#121119", "#24222f", "#3a3748", "#575369", "#7d7891"]);
const CY = -34; // the cube's center
const EDGES = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

// the cube turned by `ang` about the vertical and tipped toward us by `tilt`; [x, y, depth] per corner
function cube(ang, tilt, s) {
  const ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(tilt), st = Math.sin(tilt);
  const out = [];
  for (let i = 0; i < 8; i++) {
    const x = (i & 1 ? 1 : -1) * s, y = (i & 2 ? 1 : -1) * s, z = (i & 4 ? 1 : -1) * s;
    const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
    out.push([x1, y * ct - z1 * st, y * st + z1 * ct]);
  }
  return out;
}

export function draw(p, t, o) {
  const C = steps(o.palette, 7), S = o.seed, D = meta.duration, ph = t / D, fi = Math.floor(t * 30);

  // the cone of light, soft (light only), with dotted edges
  p.shade(-14, -48, 14, -4, (x, y, out) => {
    const v = (-4 - y) / 44, half = 2 + v * 12;
    if (Math.abs(x) > half) return;
    out.l = C[3];
    out.k = 0.18 * (1 - v * 0.6) * (1 - Math.abs(x) / half * 0.5);
  });
  for (const s of [-1, 1]) p.line(s * 2, -5, s * 9, -27, C[2]);

  // glitch: on a few frames the whole picture jumps sideways, or its top half tears off
  const g = rand(S, fi, 1), jump = g < 0.06 ? 2 : g > 0.97 ? -2 : 0, tear = rand(S, fi, 2) < 0.05;
  const dim = rand(S, fi, 3) < 0.04;
  const dx = (y) => jump + (tear && y < CY ? 3 : 0);

  // the base plate the image stands on: a ring with a bright dash running round it
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU, x = Math.cos(a) * 12, y = CY + 15 + Math.sin(a) * 3;
    const run = (((i / 40 - ph * 2) % 1) + 1) % 1;
    p.px(x + dx(y), y, run < 0.08 ? WHITE : run < 0.2 ? C[5] : C[3]);
  }

  // the cube: tumbling slowly; back edges faint, front edges bright with every third row dimmed (scanlines),
  // and a bright sweep line running down it
  const V = cube(ph * Math.PI + 0.5, 0.5 + 0.22 * Math.sin(ph * TAU), o.size), sweep = CY - 14 + ((ph * 3) % 1) * 30;
  const order = EDGES.map(([a, b]) => [a, b, V[a][2] + V[b][2]]).sort((A, B) => A[2] - B[2]);
  for (const [a, b, z] of order) {
    const [x0, y0] = V[a], [x1, y1] = V[b];
    const front = z > -0.5;
    p.line(x0 + dx(CY + y0), CY + y0, x1 + dx(CY + y1), CY + y1, (u) => {
      const y = CY + y0 + (y1 - y0) * u;
      if (!front) return C[2];
      if (Math.abs(y - sweep) < 1) return WHITE;
      return dim || Math.floor(y) % 3 === 0 ? C[3] : C[5];
    });
  }
  for (const [x, y, z] of V) if (z > 0) p.px(x + dx(CY + y), CY + y, dim ? C[4] : WHITE);
  p.glow(0, CY, 22, C[4], dim ? 0.12 : 0.25);

  // motes drifting up the cone
  cycle(t, D, 8, S + 4, (r) => r.range(0.8, 1.4), (age, life, r) => {
    const k = age / life, y = -6 - k * 40, x = r.range(-1, 1) * (2 + (-6 - y) * 0.27);
    p.px(x, y, k < 0.5 ? C[5] : C[4]);
  });

  // the projector: a squat dark puck with a glowing lens and two status lights
  p.ellipse(0, -2, 9, 3, (d, a) => (Math.sin(a) < 0 ? (d > 0.8 ? METAL[3] : METAL[2]) : METAL[1]));
  p.rect(-9, -2, 19, 2, METAL[1]);
  p.ellipse(0, -3, 3.5, 1.2, C[5]);
  p.px(0, -3, WHITE);
  p.px(-6, -1, (fi >> 3) % 2 ? C[5] : C[2]);
  p.px(6, -1, METAL[4]);
  p.glow(0, -4, 10, C[5], 0.4);
}
