import { PAL, hex, bump, fract, TAU, WHITE } from "../../core/index.js";
import { Layer, fit } from "./_lib.js";

export const meta = {
  name: "Ammo crate",
  desc: "An olive supply crate on the floor, ringed by a pulsing pickup outline with a light chasing round it, a chevron bouncing over it.",
  tags: ["pickup", "crate", "ammo", "supply", "highlight", "loop"],
  size: [44, 40],
  origin: [22, 34],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.ice, seed: 11 },
};

const L = new Layer(48, 40);
const OD = ["#151a0e", "#262f18", "#384522", "#4b5c2c", "#627538", "#7e8f48", "#a3b064"].map(hex);
const STEEL = ["#1c1c24", "#42424f", "#7d7d8c", "#a4a4b2"].map(hex);
const STENCIL = hex("#cfc58a");
const CHEVRON = ["a.....a", ".ab.ba.", "..aba..", "...a..."];

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration;
  const pulse = 0.5 + 0.5 * Math.cos(ph * TAU * 2);
  const q = L.begin(-24, -30);
  const X0 = -11, X1 = 10, TOPY = -17, FY = -13;
  // the top face, planks running across
  for (let y = TOPY; y < FY; y++) for (let x = X0; x <= X1; x++) q.px(x, y, y === TOPY ? OD[6] : (x - X0) % 7 === 6 ? OD[3] : OD[5]);
  // the front face: three planks, lit left edge, shaded right, a dark lip under the top
  for (let y = FY; y < 0; y++)
    for (let x = X0; x <= X1; x++) {
      let c = y === FY ? OD[2] : (y - FY) % 4 === 0 ? OD[2] : x === X0 ? OD[5] : x >= X1 - 1 ? OD[2] : OD[4];
      if (y === -1) c = OD[2];
      q.px(x, y, c);
    }
  // steel corners
  for (const [x, y] of [[X0, FY], [X1 - 2, FY], [X0, -3], [X1 - 2, -3]]) {
    q.rect(x, y, 3, 3, STEEL[2]);
    q.px(x + 1, y + 1, STEEL[3]);
    q.px(x + 2, y + 2, STEEL[1]);
  }
  for (const x of [X0, X1 - 2]) q.rect(x, TOPY, 3, 2, STEEL[2]), q.px(x + 1, TOPY, STEEL[3]);
  // stenciled lettering
  q.text("AMMO", -0.5, -10, STENCIL, { align: "center" });
  L.outline(OD[0]);
  // the pickup outline: pulsing, with a bright run chasing round it
  L.outline((x, y) => {
    const a = fract(Math.atan2(y + 9, (x + 0.5) * 0.8) / TAU - ph * 2);
    const run = a < 0.08 ? 2 : a < 0.16 ? 1 : 0;
    return run === 2 ? WHITE : run === 1 ? C[6] : pulse > 0.5 ? C[5] : C[4];
  });
  L.draw(p);
  // a double chevron bounces over it, pointing down at it, the near one lit first
  const hop = Math.abs(Math.sin(ph * TAU));
  const cy = Math.round(-25 - 3 * hop);
  p.sprite(CHEVRON, { a: pulse > 0.5 ? C[5] : C[4], b: C[6] }, -3, cy - 3);
  p.sprite(CHEVRON, { a: C[6], b: WHITE }, -3, cy);
  p.light(0, cy, C[5], 0.4);
  p.glowRing(0, -9, 13, 6, C[5], 0.12 + 0.12 * pulse);
  p.glow(0, -9, 26, C[4], 0.06 + 0.06 * bump(pulse, 0, 1));
}
