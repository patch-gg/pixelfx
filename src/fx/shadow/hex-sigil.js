import { burst, seg, ease, clamp, rand, bump, TAU, WHITE } from "../../core/index.js";
import { steps, shape } from "./_lib.js";

export const meta = {
  name: "Hex sigil",
  desc: "A burning pen traces a circle and a six-point star in the air, glyphs pop in at its points, it holds, flares white, then crumbles into motes.",
  tags: ["shadow", "curse", "hex", "sigil", "rune", "cast", "one-shot"],
  size: [72, 72],
  origin: [36, 36],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0e0412", "#24082e", "#3e0c4c", "#62146e", "#8c1e8e", "#c032b0", "#ec6ad2", "#ffd0f4"],
    radius: 22, seed: 13,
  },
};

const GLYPHS = [["#.#", "###", "..#"], [".#.", "#.#", "##."], ["##.", ".##", "#.."], ["#..", "###", ".#."], [".##", "#..", "##."], ["#.#", ".#.", "###"]];
const FLARE = 1.12; // the moment it flares

// the strokes, in drawing order: [points, start, duration]
function strokes(R) {
  const out = [], circle = [];
  for (let i = 0; i <= 48; i++) {
    const a = -Math.PI / 2 + (i / 48) * TAU;
    circle.push([Math.cos(a) * R, Math.sin(a) * R]);
  }
  out.push([circle, 0.04, 0.32]);
  const pt = (k) => [Math.cos(-Math.PI / 2 + (k * TAU) / 6) * (R - 1), Math.sin(-Math.PI / 2 + (k * TAU) / 6) * (R - 1)];
  out.push([[pt(0), pt(2), pt(4), pt(0)], 0.4, 0.2]);
  out.push([[pt(3), pt(5), pt(1), pt(3)], 0.62, 0.2]);
  const inner = [];
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI / 2 + (i / 24) * TAU;
    inner.push([Math.cos(a) * R * 0.32, Math.sin(a) * R * 0.32]);
  }
  out.push([inner, 0.84, 0.14]);
  return out;
}

// a polyline cut at fraction f of its length; returns [points, tip]
function partial(pts, f) {
  let total = 0;
  const lens = [];
  for (let i = 1; i < pts.length; i++) total += lens[i - 1] = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = total * clamp(f);
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (left >= lens[i - 1]) (out.push(pts[i]), (left -= lens[i - 1]));
    else {
      const u = left / lens[i - 1];
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]);
      break;
    }
  }
  return [out, out[out.length - 1]];
}

export function draw(p, t, o) {
  const C = steps(o.palette), S = o.seed, R = o.radius;
  const flare = bump(t, FLARE - 0.02, FLARE + 0.12), cool = seg(t, FLARE + 0.1, 1.7), crumble = seg(t, 1.4, 1.75);
  const grow = 1 + 0.08 * ease.outCubic(seg(t, FLARE, FLARE + 0.2));
  const hold = t > 0.98 && t < FLARE ? 0.5 + 0.5 * Math.sin((t - 0.98) * 40) : 0;
  // after the flare the lines cool down the ramp, then the last of them crumbles away
  const lineC = flare > 0.3 ? WHITE : cool > 0 ? [C[7], C[6], C[5], C[4], C[3]][Math.min(4, Math.floor(cool * 5))] : hold > 0.5 ? C[7] : C[6];

  // the strokes, drawn as far as the pen has got; once it flares, pixels drop out at random
  let pen = null, si = 0;
  for (const [pts0, start, dur] of strokes(R)) {
    const f = seg(t, start, start + dur);
    si++;
    if (f <= 0) continue;
    const pts = pts0.map(([x, y]) => [x * grow, y * grow]);
    const [cut, tip] = partial(pts, ease.inOutSine(f));
    if (f < 1) pen = tip;
    let idx = 0;
    for (let i = 1; i < cut.length; i++) {
      const [x0, y0] = cut[i - 1], [x1, y1] = cut[i], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
      const base = idx;
      idx += n;
      p.line(x0, y0, x1, y1, lineC, (u) => (rand(S, si, base + Math.round(u * n)) < crumble * 1.05 ? 0 : 1));
      if (flare > 0.3) p.line(x0 * 1.03, y0 * 1.03, x1 * 1.03, y1 * 1.03, C[6]);
      if (i % 3 === 1 || n > 6) p.glowLine(x0, y0, x1, y1, 4, C[6], 0.12 * (1 - cool) + 0.2 * flare);
    }
  }
  // the pen: a white-hot point dropping sparks
  if (pen) {
    p.circle(pen[0], pen[1], 1.2, WHITE);
    p.glow(pen[0], pen[1], 10, C[6], 0.55);
  }
  burst(30, S + 1, (r) => {
    const born = r.range(0.04, 0.98), age = t - born, life = r.range(0.2, 0.35);
    if (age < 0 || age > life) return;
    // where the pen was when this spark fell
    let at = null, si2 = 0;
    for (const [pts, start, dur] of strokes(R)) {
      si2++;
      if (born >= start && born < start + dur) at = partial(pts, ease.inOutSine(seg(born, start, start + dur)))[1];
    }
    if (!at) return;
    p.px(at[0] + r.range(-6, 6) * age, at[1] + 40 * age * age + r.range(-4, 6) * age, age / life < 0.5 ? C[7] : C[5]);
  });

  // glyphs pop into the pockets between the star's points, one after another
  for (let k = 0; k < 6; k++) {
    const born = 0.86 + k * 0.035, g = seg(t, born, born + 0.08);
    if (g <= 0 || crumble >= 0.5) continue;
    const a = -Math.PI / 2 + ((k + 0.5) * TAU) / 6, gx = Math.cos(a) * R * 0.8 * grow, gy = Math.sin(a) * R * 0.8 * grow;
    shape(p, GLYPHS[k], Math.round(gx) - 1, Math.round(gy) - 1, () => (g < 0.5 || flare > 0.3 ? WHITE : lineC));
  }

  // the flare: a white heart and a ring thrown out
  if (flare > 0) {
    p.circle(0, 0, 3 + 4 * flare, (d) => (d < 0.6 ? WHITE : C[7]));
    p.glow(0, 0, 40, C[6], 0.5 * flare);
  }
  const ring = seg(t, FLARE, FLARE + 0.3);
  if (ring > 0 && ring < 1) p.ring(0, 0, R * grow + 3 + 6 * ease.outCubic(ring), 1, ring < 0.4 ? C[7] : ring < 0.7 ? C[6] : C[4]);

  // motes: the crumbling sigil drifts up
  burst(26, S + 2, (r) => {
    const a = r.range(0, TAU), rr = r.next() < 0.6 ? R : r.range(0, R), born = FLARE + 0.15 + r.range(0, 0.4), age = t - born, life = Math.min(r.range(0.3, 0.5), 1.88 - born);
    if (age < 0 || age > life) return;
    const x = Math.cos(a) * rr * grow + Math.sin(age * 9 + r.next() * 6) * 1.5, y = Math.sin(a) * rr * grow - age * r.range(18, 32);
    p.px(x, y, age / life < 0.4 ? C[7] : age / life < 0.75 ? C[6] : C[4]);
  });

  // light: builds while it's drawn, spikes at the flare, falls away as it crumbles
  const build = seg(t, 0, 1) * (1 - cool);
  p.glow(0, 0, R + 14, C[5], (0.12 + 0.18 * build + 0.2 * hold) * (1 - crumble));
}
