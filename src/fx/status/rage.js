import { cycle, tileFbm, bump, clamp, at } from "../../core/index.js";
import { steps, geom, recolor, tone } from "./_lib.js";

export const meta = {
  name: "Rage",
  desc: "A red aura roars up behind the target and swells on every heartbeat; its outline flares, streaks shoot upward and an anger mark pops.",
  tags: ["status", "rage", "berserk", "aura", "buff", "loop"],
  size: [48, 54],
  origin: [24, 50],
  duration: 1,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: {
    palette: ["#1a0306", "#3c060c", "#6e0a12", "#a8121a", "#e0261e", "#ff5a2a", "#ffa060", "#fff0c8"],
    seed: 2,
  },
};

const VEIN = [".##.##.", "###.###", "##...##", ".......", "##...##", "###.###", ".##.##."];
// two beats a loop, the second softer
const beatAt = (ph) => Math.max(bump(ph, 0, 0.14), 0.75 * bump(ph, 0.2, 0.34));

// behind: the aura, a flame field around the silhouette that roars upward and swells on the beat
export function drawBack(p, t, o) {
  const R = steps(o.palette), a = o.actor, g = geom(a.mask), ph = t / meta.duration, beat = beatAt(ph);
  // an energy shell rather than fire: dark crimson against the body, burning bright only at its outer edge
  const AURA = [R[7], R[6], R[5], R[4], R[3], R[2]];
  p.shade(a.x - 9, a.y - 16, a.x + a.w + 9, 0, (x, y) => {
    const nr = g.near(x - a.x, y - a.y);
    if (!nr || nr[0] === 0) return;
    const [d, , vy] = nr, up = clamp(-vy / d + 0.35);
    const n = tileFbm(x * 0.5, y * 0.22 + ph * 16, 0, 16, o.seed, 2) * 0.5 + 0.5;
    const reach = (2.6 + up * 9 * (0.4 + 0.8 * n)) * (1 + 0.32 * beat);
    const v = 1 - d / reach;
    if (v <= 0) return;
    return at(AURA, v * 1.25 + n * 0.15 - beat * 0.15);
  });
  p.glow(0, a.y + 8, 30, R[4], 0.18 + 0.22 * beat);
}

// in front: the body flushes and its outline flares on the beat, streaks shoot up, the anger mark pops
export function draw(p, t, o) {
  const R = steps(o.palette), a = o.actor, ph = t / meta.duration, beat = beatAt(ph);
  if (beat > 0.6) recolor(p, a, (c) => (c && tone(c) < 0.45 ? R[clamp(Math.round(1 + tone(c) * 6), 1, 4)] : 0));
  p.outline(a.mask, a.x, a.y, beat > 0.5 ? R[7] : R[5]);
  cycle(t, meta.duration, 8, o.seed, (r) => r.range(0.25, 0.4), (age, life, r) => {
    const k = age / life, x = a.x + (r.next() < 0.5 ? r.range(-5, -1) : r.range(a.w, a.w + 4)), y = r.range(-2, a.y + 10) - age * r.range(70, 110);
    p.line(x, y, x, y + r.range(3, 6) * (1 - k * 0.5), (u) => (u < 0.3 ? R[7] : R[5]));
  });
  const pop = beat > 0.4 ? 1 : 0, vx = a.head[0] + 4 + pop, vy = a.head[1] - 3 - pop;
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (VEIN[r][c] === "#") p.px(vx + c, vy + r, pop ? R[7] : r < 3 ? R[6] : R[5]);
}
