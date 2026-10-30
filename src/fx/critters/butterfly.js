import { hex, TAU, WHITE } from "../../core/index.js";
import { Grid, shades, shift } from "./_lib.js";

export const meta = {
  name: "Butterfly",
  desc: "A blue butterfly flutters along a lazy looping path: four-frame wingbeats closing to a sliver, dark wing borders with white spots, a little glide.",
  tags: ["critter", "butterfly", "insect", "flying", "nature", "loop"],
  size: [52, 44],
  origin: [26, 22],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#0b0f2c", "#18296e", "#2a5fc4", "#4fa4f2", "#c6ecff"], body: "#3a2c40", beats: 9, seed: 1 },
};

// a wing is a turned ellipse: [cx, cy, rx, ry, turn] from the body, for the right side
const UPPER = [6.6, -4.4, 7.4, 5.3, -0.6], LOWER = [4.6, 3.4, 5, 4, 0.6];
// openness through one beat: open, closing, edge-on, opening (one frame each, held)
const OPEN = [1, 0.55, 0.2, 0.55];

function wing(g, S, bx, by, side, open, [cx, cy, rx, ry, a], spots) {
  const cs = Math.cos(a), sn = Math.sin(a), R = Math.max(rx, ry) + 1;
  g.shade(bx - (R + Math.abs(cx)) * 1.1, by + cy - R, bx + (R + Math.abs(cx)) * 1.1, by + cy + R, (x, y) => {
    const ux = ((x - bx) * side) / open; // undo the flap squash
    if (ux < 0) return 0;
    const dx = ux - cx, dy = y - by - cy, u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry;
    const d = Math.sqrt(u * u + v * v);
    if (d > 1) return 0;
    const ang = Math.atan2(v, u);
    if (d > 0.74) {
      // the dark border, with a row of white spots along the outer edge
      for (const s of spots) if (Math.abs(ang - s) < 0.16 && d > 0.79 && d < 0.92) return WHITE;
      return S[1];
    }
    if (ux < 1.2 || d < 0.3) return S[2];
    return u < -0.1 && v < 0.2 ? S[4] : S[3];
  });
}

export function draw(p, time, o) {
  const t = shift(time, meta.duration, o.seed);
  const S = shades(o.palette, 5), body = hex(o.body), ph = t / meta.duration;
  const beat = (ph * o.beats) % 1, fi = Math.floor(beat * 4);
  // a glide: on one beat in three the wings hold open
  const glide = Math.floor(ph * o.beats) % 3 === 2 && fi < 3;
  const open = glide ? 1 : OPEN[fi];
  const bx = Math.round(Math.sin(ph * TAU) * 10), by = Math.round(Math.sin(ph * TAU * 2) * 5 + (fi === 2 ? -1 : 0));
  const g = new Grid(-26, -22, 52, 44);
  for (const side of [-1, 1]) {
    const root = side > 0 ? bx + 0.5 : bx - 0.5;
    wing(g, S, root, by, side, open, LOWER, [0.7]);
    wing(g, S, root, by, side, open, UPPER, [-0.25, 0.45]);
  }
  // body and feelers
  for (let y = -3; y <= 5; y++) g.set(bx, by + y, body), g.set(bx - 1, by + y, y < 3 ? body : 0);
  g.set(bx - 1, by - 3, S[1]);
  const sway = fi === 2 ? 1 : 0;
  g.line(bx - 1, by - 4, bx - 4, by - 9 + sway, body);
  g.line(bx, by - 4, bx + 3, by - 9 + sway, body);
  g.outline(S[0]);
  g.set(bx - 4, by - 10 + sway, S[4]), g.set(bx + 3, by - 10 + sway, S[4]);
  g.draw(p);
}
