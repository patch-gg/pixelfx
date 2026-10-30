import { PAL, ramp, fit, burst, fly, seg, ease, lerp, WHITE } from "../../core/index.js";

export const meta = {
  name: "Whip crack",
  desc: "A whip lashes out to the right: a loop rolls down its length, the tip snaps straight with a white crack and sparks, then the lash sags and fades.",
  tags: ["melee", "whip", "lash", "crack", "combat", "directional", "one-shot"],
  size: [92, 54],
  origin: [26, 44],
  duration: 0.55,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.volt, leather: ["#2a160c", "#4a2a16", "#6e4222", "#8e5a30", "#b07a48"], length: 46, seed: 11 },
};

const N = 28, HX = 5, HY = -11;
const T0 = -0.03, DUR = 0.13, LAG = 0.1; // the handle swings over 0.13 s; the bend reaches the tip 0.1 s later

// the whip as points, handle first: each bit of it turns from wound-back to straight out, later and faster
// the further it is from the hand, so a loop rolls down to the tip and the tip flips over in a flash
function rope(t, L) {
  const pts = [[HX, HY]], l = L / N, crack = T0 + LAG + DUR * 0.3;
  let x = HX, y = HY;
  for (let i = 0; i < N; i++) {
    const s = (i + 0.5) / N, start = T0 + s * LAG, win = DUR * (1 - 0.72 * s);
    const k = ease.inOutCubic(seg(t, start, start + win));
    const back = -1.45 - 1.75 * s; // wound back: up from the hand, curling over behind the head
    const sag = 0.55 * s * s * ease.outQuad(seg(t, crack + 0.03, crack + 0.35)); // after the crack it droops
    const th = lerp(back, 0.04 - 0.08 * s, k) + sag;
    x += Math.cos(th) * l;
    y += Math.sin(th) * l;
    pts.push([x, y]);
  }
  return pts;
}

export function draw(p, t, o) {
  const C = ramp(o.palette), Lc = fit(o.leather, 5), L = o.length, S = o.seed, top = C.length - 1;
  const crack = T0 + LAG + DUR * 0.3, gone = seg(t, crack + 0.2, crack + 0.38);
  // the tip's path just before the crack: a fast streak of light
  if (t < crack + 0.05) {
    for (let j = 1; j <= 4; j++) {
      const a = rope(Math.max(0, t - j * 0.012), L)[N], b = rope(Math.max(0, t - (j - 1) * 0.012), L)[N];
      const k = seg(t, crack - 0.07, crack) * (1 - seg(t, crack, crack + 0.05));
      if (k > 0.25 * j) p.line(a[0], a[1], b[0], b[1], j < 2 ? WHITE : j < 3 ? C[top - 1] : C[top - 3]);
    }
  }
  // the whip: a thick handle, a tapering lash, a pale popper at the tip; it frays from the tip as it goes
  if (gone < 1) {
    const pts = rope(t, L), keep = Math.round(N * (1 - gone));
    for (let i = 0; i < keep; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], s = i / N;
      if (i < 4) p.line(x0, y0 + 1, x1, y1 + 1, Lc[1]), p.line(x0, y0, x1, y1, Lc[2]);
      else {
        p.line(x0, y0, x1, y1, s < 0.55 ? Lc[4] : Lc[3]);
        if (s < 0.45) p.line(x0, y0 + 1, x1, y1 + 1, Lc[2]);
      }
    }
    if (keep === N) p.px(pts[N][0], pts[N][1], Lc[4]);
  }
  // the crack: a white pop at the tip, crack lines jabbing out, a ring, sparks
  const q = t - crack;
  if (q >= 0) {
    const [tx, ty] = [HX + L * 0.985, HY + 0.5]; // where the tip snaps straight
    if (q < 0.034) p.circle(tx, ty, 3, WHITE), p.glow(tx, ty, 20, C[top - 1], 0.7);
    if (q < 0.1) {
      const e = 1 - seg(q, 0.02, 0.1);
      for (const [a, len] of [[-1.1, 7], [-0.35, 9], [0.4, 8], [1.15, 6], [-2.3, 5], [2.4, 5]]) {
        const r0 = 3 + 4 * seg(q, 0, 0.1), r1 = r0 + len * e;
        p.line(tx + Math.cos(a) * r0, ty + Math.sin(a) * r0, tx + Math.cos(a) * r1, ty + Math.sin(a) * r1, (u) => (u < 0.5 ? WHITE : C[top - 1]));
      }
    }
    const rg = seg(q, 0.01, 0.09);
    if (rg > 0 && rg < 1) p.ring(tx, ty, 4 + 7 * ease.outCubic(rg), 1, rg < 0.5 ? C[top - 1] : C[top - 3], (v, a) => (Math.sin(a * 3 + 1) > -0.45 ? 1 : 0));
    p.glow(tx, ty, 16, C[top - 2], 0.5 * (1 - seg(q, 0, 0.2)));
    burst(9, S, (r) => {
      const a = r.range(-Math.PI, Math.PI), sp = r.range(50, 120), life = r.range(0.14, 0.3);
      if (q > life) return;
      const [x, y] = fly(tx, ty, Math.cos(a) * sp, Math.sin(a) * sp, q, 160, 4), k = q / life;
      p.px(x, y, k < 0.35 ? WHITE : k < 0.7 ? C[top - 1] : C[top - 3]);
      p.light(x, y, C[top - 2], 0.5 * (1 - k));
    });
  }
}
