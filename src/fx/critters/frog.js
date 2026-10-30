import { seg, clamp, lerp, hex, RAMP, TAU, WHITE } from "../../core/index.js";
import { Grid, shades, lit, shift } from "./_lib.js";

export const meta = {
  name: "Frog",
  desc: "A fat green frog sits and puffs its throat, crouches, springs straight up with its legs flung out, and lands back in a squat.",
  tags: ["critter", "frog", "hop", "nature", "jump", "loop", "ground"],
  size: [48, 44],
  origin: [24, 39],
  duration: 1.8,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0e2416", "#23592b", "#47993b", "#9bd35b", "#eef6b6"], seed: 1 },
};

const EYE = hex("#f2c84a");

// poses: body center, tilt (radians, nose up is negative), stretch; hind leg hip, knee, ankle, toe; front leg
// shoulder, elbow, hand. All in px from the spot it sits on, facing right.
const P = {
  sit: { b: [0, -6], tilt: -0.32, s: 1, h: [[-4, -5], [2, -2.5], [-5, -1], [1, 0]], f: [[4, -4], [5.5, -2], [6.5, 0]] },
  crouch: { b: [0, -4.8], tilt: -0.2, s: 0.9, h: [[-4, -4], [2.5, -2], [-5, -1], [1.5, 0]], f: [[4.5, -3], [6.5, -1.5], [7, 0]] },
  leap: { b: [1, -11], tilt: -0.85, s: 1.22, h: [[-3, -8], [-5, -4], [-6.5, -1], [-8, 0]], f: [[5, -14], [8, -15], [10.5, -16]] },
  air: { b: [0, -17], tilt: -0.15, s: 1.1, h: [[-5, -16], [-9, -14], [-12.5, -15], [-15, -14.5]], f: [[5, -15], [8, -13.5], [10, -12]] },
  fall: { b: [0, -11], tilt: 0.1, s: 1, h: [[-5, -10], [-2, -7], [-7, -6], [-3, -4.5]], f: [[5, -9], [7, -6], [8, -3.5]] },
  land: { b: [0, -4.5], tilt: -0.05, s: 0.82, h: [[-4.5, -4], [2, -2], [-5.5, -1], [1.5, 0]], f: [[5, -3], [7, -1.5], [8.5, 0]] },
};
const SEQ = [[0, "sit"], [0.34, "sit"], [0.42, "crouch"], [0.47, "leap"], [0.58, "air"], [0.7, "fall"], [0.76, "land"], [0.88, "sit"], [1, "sit"]];

function pose(ph) {
  for (let i = 0; i < SEQ.length - 1; i++) {
    const [p0, a] = SEQ[i], [p1, b] = SEQ[i + 1];
    if (ph < p0 || ph > p1) continue;
    let u = seg(ph, p0, p1);
    u = u * u * (3 - 2 * u);
    const A = P[a], B = P[b], L = (x, y) => lerp(x, y, u), LP = (pa, pb) => [L(pa[0], pb[0]), L(pa[1], pb[1])];
    return { b: LP(A.b, B.b), tilt: L(A.tilt, B.tilt), s: L(A.s, B.s), h: A.h.map((q, k) => LP(q, B.h[k])), f: A.f.map((q, k) => LP(q, B.f[k])) };
  }
  return P.sit;
}

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), ph = t / meta.duration, Q = pose(ph);
  const [bx, by] = Q.b, cs = Math.cos(Q.tilt), sn = Math.sin(Q.tilt), rx = 7.4 * Q.s, ry = 4.8 / Math.sqrt(Q.s);
  // along the body axis: u forward, v down
  const at = (u, v) => [bx + u * cs - v * sn, by + u * sn + v * cs];
  const g = new Grid(-24, -39, 48, 42);
  // far front leg, in shadow
  const [sh, el, ha] = Q.f;
  g.tube([[sh[0] - 2, sh[1]], [el[0] - 2, el[1]], [ha[0] - 2, ha[1]]], 1, S[1]);
  // body: a tilted egg, green back with dark spots, pale belly
  g.shade(bx - 12, by - 12, bx + 12, by + 10, (x, y) => {
    const dx = x - bx, dy = y - by, u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry;
    const w = u > 0 ? 1 - u * 0.12 : 1;
    if (u * u + (v / w) * (v / w) > 1) return 0;
    if (v > 0.5) return S[4];
    if (Math.hypot(u + 0.45, v + 0.5) < 0.16) return S[1];
    const L = lit(u, v);
    return L > 0.72 ? S[3] : S[2];
  });
  // throat: a pale pouch that puffs while it sits
  const puff = ph < 0.34 ? Math.max(0, Math.sin(ph * TAU * 6)) : 0;
  const [tx, ty] = at(rx * 0.68, ry * 0.62);
  g.ellipse(tx, ty, 2 + puff * 1.2, 1.4 + puff * 1.1, S[4]);
  // hind leg: a big thigh, a shin, a long webbed foot
  const [hip, knee, ankle, toe] = Q.h;
  g.tube([hip, knee], (u) => 2.8 - u * 1.2, (u, v) => (v < 0.45 ? S[3] : v < 0.85 ? S[2] : S[1]));
  g.tube([knee, ankle], (u) => 1.6 - u * 0.5, S[2]);
  g.tube([ankle, toe], 0.8, S[2]);
  const fx = toe[0] - ankle[0], fy = toe[1] - ankle[1], fl = Math.hypot(fx, fy) || 1;
  g.set(toe[0] + (fx / fl) * 1.3, toe[1] + (fy / fl) * 1.3, S[3]);
  // near front leg
  g.tube([sh, el, ha], (u) => 1.4 - u * 0.4, (u, v) => (v < 0.4 ? S[3] : S[2]));
  g.set(ha[0] + 1, ha[1], S[2]);
  // the eye bump on top of the head, a wide mouth
  const [ex, ey] = at(rx * 0.42, -ry * 0.92);
  g.ellipse(ex, ey, 3, 2.8, (nx, ny) => (lit(nx, ny) > 0.6 ? S[3] : S[2]));
  // a gold eye with a bar pupil; a blink shuts it to a line
  const blink = ph > 0.12 && ph < 0.16;
  const eX = Math.round(ex + 0.4), eY = Math.round(ey - 0.2);
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) g.set(eX + i, eY + j, blink ? (j === 0 ? S[0] : S[3]) : j === 0 ? S[0] : EYE);
  if (!blink) g.set(eX + 1, eY - 1, WHITE);
  for (let k = 0; k <= 7; k++) {
    const [mx, my] = at(rx * 0.96 - k * 1.05, ry * 0.18 + k * 0.1);
    g.set(mx, my, k < 6 ? S[0] : S[1]);
  }
  g.outline(S[0]);
  g.draw(p);
  // shadow on the floor, small while it's up; dust when it lands
  const high = clamp(-(by + 6) / 11);
  p.ellipse(0, 0.5, 9 * (1 - 0.45 * high), 1.3, 0xff141019, 0.65);
  const d = seg(ph, 0.76, 0.9);
  if (d > 0 && d < 1)
    for (const side of [-1, 1]) {
      const e = 1 - (1 - d) ** 2;
      p.circle(side * (9 + e * 6), -1.5 - e * 2, 1.6 * (1 - d * 0.6), RAMP.dust[5], clamp(1.3 - d * 1.4));
    }
}
