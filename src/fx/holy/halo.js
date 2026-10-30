import { PAL, cycle, TAU, WHITE } from "../../core/index.js";
import { fit, ovalLine, ahead, sparkle } from "./_lib.js";

export const meta = {
  name: "Halo",
  desc: "A golden halo floats over the head, bobbing gently; a glint runs round the ring and now and then a sparkle winks on it.",
  tags: ["holy", "halo", "blessed", "status", "character", "loop"],
  size: [32, 36],
  origin: [16, 31],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.holy, radius: 6, seed: 37 },
};

export function draw(p, t, o) {
  const C = fit(o.palette), A = o.actor, ph = t / meta.duration, S = o.seed;
  const RX = o.radius, RY = Math.max(1.5, RX * 0.32), hy = A.head[1] - 4 + Math.round(Math.sin(ph * TAU) * 1);
  const glint = ph * TAU - Math.PI / 2;
  // the ring: thin and deeper gold on its far side, a thick bright band on its near side, a white glint running round
  const col = (ang) => {
    const g = ahead(ang, glint);
    if (g < 0.35) return WHITE;
    if (g < 0.9) return C[6];
    return Math.sin(ang) > 0 ? C[5] : C[4];
  };
  ovalLine(p, RX, RY, col, 1, 0, hy);
  ovalLine(p, RX - 0.6, RY, (ang) => (ahead(ang, glint) < 0.6 ? C[6] : C[3]), (ang) => (Math.sin(ang) > 0.35 ? 1 : 0), 0, hy + 1);
  // sparkles that wink on the ring
  cycle(t, meta.duration, 2, S, 0.4, (age, life, r) => {
    const k = age / life, a = r.range(0, TAU);
    sparkle(p, Math.cos(a) * RX, hy + Math.sin(a) * RY - 1, k < 0.25 ? 1 : k < 0.6 ? 2 : k < 0.85 ? 1 : 0, C[6], C[5], WHITE);
  });
  // warm light over the head
  const pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  p.glow(0, hy, RX + 10, C[4], 0.28 * pulse);
  p.glow(0, hy + 3, 8, C[5], 0.18 * pulse);
}
