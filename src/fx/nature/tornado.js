import { ramp, at, cycle, tileNoise, clamp, lerp, TAU, hex } from "../../core/index.js";

export const meta = {
  name: "Tornado",
  desc: "A twisting funnel of wind snakes up from the floor, its bands whipping round; rocks, sticks and leaves orbit it and a dust skirt churns at its foot.",
  tags: ["nature", "wind", "tornado", "storm", "hazard", "ground", "loop"],
  size: [76, 80],
  origin: [38, 72],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1a1b24", "#2c2e3a", "#43465a", "#5e6378", "#7e8498", "#a2a8ba", "#c8ccd8", "#eef0f4"], height: 62, seed: 59 },
};

const DEBRIS = ["#3a2a1c", "#6a4a2c", "#8e6a3e"].map(hex);
const LEAF = ["#2c5a22", "#4f9a3a", "#8ccc52"].map(hex);

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, D = meta.duration, ph = t / D, H = o.height;
  // the axis snakes: the foot stays put, the body leans and sways once a loop
  const axis = (y) => {
    const v = -y / H;
    return Math.sin(ph * TAU + v * 2.4) * 4 * v + v * v * 5;
  };
  const rad = (y) => {
    const v = clamp(-y / H);
    return 2.2 + 17 * Math.pow(v, 1.5) + Math.sin(v * 9 - ph * TAU * 2) * 0.8 * v;
  };
  // debris behind the funnel
  const debris = (front) => cycle(t, D, 12, S + 1, (r) => r.range(0.8, 1.2), (age, life, r, i) => {
    const k = age / life, a = r.range(0, TAU) + age * r.range(9, 13), y = -r.range(4, 12) - k * r.range(26, 44);
    const R = rad(y) + r.range(2, 6), d = Math.sin(a);
    if (d >= 0 !== front) return;
    const x = axis(y) + Math.cos(a) * R, yy = y + d * 2;
    if (i % 3 === 0) p.sprite(age * 14 % 2 < 1 ? ["ab"] : ["a", "b"], { a: LEAF[1], b: LEAF[2] }, x, yy);
    else if (i % 3 === 1) p.rect(x, yy, 2, 2, DEBRIS[front ? 1 : 0]), p.px(x, yy, DEBRIS[2]);
    else p.line(x - 1, yy + (age * 10 % 2 < 1 ? 1 : -1), x + 1, yy - (age * 10 % 2 < 1 ? 1 : -1), DEBRIS[1]);
  });
  debris(false);
  // the funnel: a surface of bands spinning round the axis; lit on the left, dark on the right
  p.shade(-32, -H - 6, 32, 0, (x, y) => {
    const v = -y / H, R = rad(y), u = (x - axis(y)) / R;
    // a ragged edge; the top flares into lumps that roll round with the spin
    const lumps = tileNoise((Math.atan2(0.4, u) / TAU) * 8 + ph * 8, 0.5, 8, 0, S + 2);
    const edge = 1 + tileNoise(y * 0.35, ph * 6, 0, 6, S) * 0.16 + (v > 0.86 ? (v - 0.86) * 4 * (0.6 + lumps * 0.5) : 0);
    if (Math.abs(u) > edge || v > 1.04 + lumps * 0.05) return;
    const phi = Math.asin(clamp(u)); // where on the front of the funnel this pixel is
    const band = tileNoise((phi / TAU) * 10 + ph * 20, y * 0.42, 10, 0, S + 1);
    let k = 0.3 - u * 0.3 + band * 0.4 + v * 0.12;
    if (Math.abs(u) > edge - 0.2) k -= 0.16;
    return at(C.slice(1, 8), k);
  });
  debris(true);
  // the dust skirt: puffs churning round the foot
  cycle(t, D, 10, S + 2, (r) => r.range(0.5, 0.8), (age, life, r) => {
    const k = age / life, a = r.range(0, TAU) + age * 8, R = 4 + k * r.range(8, 13);
    const x = Math.cos(a) * R, y = -1 - k * r.range(2, 6) + Math.sin(a) * 1.5, s = r.range(1.8, 3) * (1 - k * 0.7);
    p.circle(x, y, s, (d, an) => (d < 0.5 && an < -0.3 ? C[5] : d < 0.85 ? C[4] : C[3]));
  });
  p.glow(axis(-H * 0.5), -H * 0.5, 30, C[6], 0.06);
}
