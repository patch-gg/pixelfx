import { ramp, hex, burst, fly, seg, ease, clamp, WHITE } from "../../core/index.js";

export const meta = {
  name: "Iaido cut",
  desc: "A dash cut: the fighter arrives in a white streak that leaves one long line hanging in the air; a beat later the line flashes and splits open.",
  tags: ["melee", "slash", "dash", "iaido", "katana", "combat", "directional", "one-shot"],
  size: [88, 36],
  origin: [74, 30],
  duration: 0.9,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#10141c", "#232b3a", "#3e4a60", "#64748e", "#98a6bc", "#cad4e2", "#f0f4fa", "#ffffff"], accent: "#e8304a", length: 66, seed: 14 },
};

// the fighter is a blur inside the streak on the first frame, then stands where the dash ended
export const actorAlpha = (t) => (t < 0.03 ? 0 : 1);

export function draw(p, t, o) {
  const C = ramp(o.palette), A = hex(o.accent), L = o.length, S = o.seed, top = C.length - 1;
  const y0 = -10, xa = -L + 2, xb = 5; // the cut runs from where the dash began to just past the fighter
  const SPLIT = 0.36;
  // afterimages of the fighter left along the dash: flat silhouettes, the farthest gone first
  const act = o.actor;
  if (act) {
    for (let i = 1; i <= 3; i++) {
      if (t >= 0.1 - i * 0.025) continue;
      p.mask(act.mask, act.x - i * 15, act.y, C[top - 2 - i]);
      p.outline(act.mask, act.x - i * 15, act.y, C[top - 1 - i]);
    }
  }
  // the dash: a thick white streak on the first frames, with speed lines
  if (t < 0.1) {
    const e = 1 - seg(t, 0.03, 0.1), th = Math.round(1 + 2 * e);
    for (let d = -th; d <= th; d++) {
      const back = xa + (L * 0.5 * seg(t, 0.02, 0.1)) * (1 - Math.abs(d) / (th + 1)) + Math.abs(d) * 6;
      p.line(back, y0 + d, xb + 2 - Math.abs(d) * 2, y0 + d, Math.abs(d) < 2 ? WHITE : C[top - 1]);
    }
    burst(7, S + 3, (r, i) => {
      const dy = (i % 2 ? 1 : -1) * r.range(4, 9), x1 = xb - r.range(2, 14), l = r.range(14, 34) * e;
      if (l > 2) p.line(x1 - l, y0 + dy, x1, y0 + dy, r.next() < 0.5 ? C[top - 1] : C[top - 3]);
    });
    p.glowLine(xa, y0, xb, y0, 8, C[top - 2], 0.4 * e);
  }
  // the line that hangs in the air: a hairline with a glint running along it, holding for a beat
  if (t >= 0.06 && t < SPLIT) {
    p.line(xa + 4, y0, xb, y0, (u) => (u < 0.06 || u > 0.97 ? C[top - 3] : C[top - 1]));
    const gx = xa + (xb - xa) * ease.inOutSine(seg(t, 0.1, SPLIT - 0.04));
    if (gx > xa + 6 && gx < xb - 2) p.px(gx, y0, WHITE), p.px(gx - 1, y0, WHITE), p.px(gx, y0 - 1, C[top]), p.px(gx, y0 + 1, C[top]);
  }
  const q = t - SPLIT;
  if (q < 0) return;
  // the split: one white frame, then the two lips part, crimson showing between them, and fray from the ends in
  if (q < 0.034) {
    p.rect(xa + 2, y0 - 1, xb - xa - 2, 3, WHITE);
    p.glowLine(xa, y0, xb, y0, 12, C[top - 1], 0.6);
    return;
  }
  const open = ease.outCubic(seg(q, 0.03, 0.2)), fray = seg(q, 0.12, 0.5);
  const half = (xb - xa) / 2, mid = (xa + xb) / 2, reach = half * (1 - ease.inQuad(fray));
  if (reach > 1) {
    const gap = 1 + 3 * open;
    for (const side of [-1, 1]) {
      const y = y0 + side * gap, x0 = mid - reach, x1 = mid + reach;
      p.line(x0, y, x1, y, (u) => (Math.abs(u - 0.5) < 0.42 ? (q < 0.12 ? WHITE : C[top - 1]) : C[top - 3]));
    }
    if (open > 0.3) p.line(mid - reach * 0.85, y0, mid + reach * 0.85, y0, A);
    p.glowLine(mid - reach, y0, mid + reach, y0, 7, A, 0.25 * (1 - fray));
  }
  // flecks spat out of the split along its length
  burst(9, S, (r) => {
    const born = r.range(0, 0.06), age = q - born, life = r.range(0.18, 0.3);
    if (age < 0 || age > life) return;
    const x0 = xa + (xb - xa) * r.range(0.1, 0.95), side = r.next() < 0.5 ? -1 : 1;
    const [x, y] = fly(x0, y0 + side * 2, r.range(-20, 30), side * r.range(20, 60), age, 160, 3), k = age / life;
    if (y > 0) return;
    p.px(x, y, k < 0.35 ? WHITE : k < 0.7 ? A : C[top - 3]);
  });
}
