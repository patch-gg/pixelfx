import { seg, ease, WHITE } from "../../core/index.js";
import { Layer, fit } from "./_lib.js";

export const meta = {
  name: "Exclamation",
  desc: "A fat ! springs up over the head: stretched thin on the way up, squashed as it lands, three surprise ticks flicking out; it bobs, then pinches away.",
  tags: ["ui", "alert", "exclamation", "surprise", "notice", "status", "one-shot"],
  size: [40, 56],
  origin: [20, 50],
  duration: 1.1,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: ["#2a1206", "#6a2a0a", "#c0480e", "#f07818", "#ffb02e", "#ffe070", "#fff8d0", "#ffffff"], seed: 16 },
};

const L = new Layer(40, 40);
// hand-timed poses, as half-widths per row from the top of the bar, the gap, then the dot's rows and half-width
const POSE = {
  tall: { bar: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], gap: 2, dot: 3, dw: 1 },
  normal: { bar: [1, 2, 2, 2, 2, 2, 1, 1, 1, 0], gap: 2, dot: 3, dw: 1 },
  squash: { bar: [2, 2, 2, 2, 2, 1, 1], gap: 1, dot: 2, dw: 1 },
  thin: { bar: [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], gap: 1, dot: 2, dw: 0 },
};

function mark(q, C, pose, base) {
  const { bar, gap, dot, dw } = POSE[pose], top = base - dot - gap - bar.length;
  const shadeRow = (y, hw, first) => {
    for (let x = -hw; x <= hw; x++) q.px(x, y, x < 0 || hw === 0 ? (first ? WHITE : C[6]) : x === 0 ? (first ? C[6] : C[5]) : C[4]);
  };
  bar.forEach((hw, i) => shadeRow(top + i, hw, i === 0));
  for (let i = 0; i < dot; i++) shadeRow(base - dot + i, dw, i === 0);
  return top;
}

export function draw(p, t, o) {
  const C = fit(o.palette), head = o.actor.head[1];
  if (t >= 1.02) return;
  const pose = t < 0.1 ? "tall" : t < 0.18 ? "squash" : t < 0.22 ? "tall" : t < 0.88 ? "normal" : t < 0.94 ? "squash" : "thin";
  const rise = ease.outCubic(seg(t, 0, 0.1)), bobY = t > 0.3 && t < 0.88 ? Math.round(Math.sin((t - 0.3) * 9)) : 0;
  const base = head - 4 + Math.round(4 * (1 - rise)) + bobY; // the bottom of the dot
  L.begin(-20, base - 26);
  const top = mark(L.q, C, pose, base);
  L.outline(C[1]);
  L.outline(C[0]);
  L.draw(p);
  // surprise ticks flick out around its top
  const tk = seg(t, 0.12, 0.38);
  if (tk > 0 && tk < 1) {
    const d = 2 + 4 * ease.outCubic(tk), len = Math.round(3 * (1 - tk)) + 1;
    for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1]]) {
      const x0 = dx * (4 + d), y0 = top - 1 + (dx ? 2 : -d * 0.8);
      p.line(x0, y0, x0 + dx * len, y0 + dy * len, tk < 0.5 ? WHITE : C[5]);
    }
  }
  p.glow(0, base - 7, 14, C[5], 0.3 * (1 - seg(t, 0.1, 0.6)) + 0.08);
}
