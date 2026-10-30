import { PAL, cycle } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Haste",
  desc: "Striped afterimages shiver behind the target, speed lines stream past it and dust kicks off its heels: it's moving faster than it should.",
  tags: ["status", "haste", "speed", "buff", "afterimage", "directional", "loop"],
  size: [52, 32],
  origin: [32, 28],
  duration: 0.6,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: true,
  options: { palette: PAL.volt, seed: 3 },
};

// behind the body: afterimages, each a striped copy of the silhouette, trailing and shivering
export function drawBack(p, t, o) {
  const C = steps(o.palette), a = o.actor, m = a.mask, f = Math.floor(t * 30);
  const ghosts = [[-4 - (f % 2), 2, C[2], C[4]], [-9 - (f % 3 === 0 ? 1 : 0), 3, C[1], C[2]]];
  for (const [dx, every, body, edge] of ghosts) {
    for (let my = 0; my < m.h; my++) {
      if ((my + f) % every) continue;
      for (let mx = 0; mx < m.w; mx++) {
        if (!m.data[my * m.w + mx]) continue;
        const right = mx === m.w - 1 || !m.data[my * m.w + mx + 1];
        p.px(a.x + mx + dx, a.y + my, right ? edge : body);
      }
    }
  }
  // speed lines streaming back from behind the body
  cycle(t, meta.duration, 9, o.seed, (r) => r.range(0.14, 0.22), (age, life, r) => {
    const k = age / life, y = Math.round(a.y + r.range(1, a.h - 2)), len = r.range(4, 10), sp = r.range(100, 150);
    const x = a.x + r.range(2, a.w) - age * sp;
    p.line(x, y, x + len * (1 - k * 0.5), y, (u) => (u < 0.3 ? (k < 0.5 ? C[7] : C[6]) : u < 0.7 ? C[5] : C[3]));
  });
  p.glow(-4, a.y + 10, 18, C[4], 0.15);
}

// in front: dust kicked off the heels
export function draw(p, t, o) {
  const C = steps(o.palette), D = meta.duration;
  cycle(t, D, 4, o.seed + 1, (r) => r.range(0.22, 0.32), (age, life, r) => {
    const k = age / life, x = r.range(-4, 2) - age * r.range(40, 70), y = -1 - Math.sin(k * Math.PI) * r.range(1, 3);
    p.circle(x, y, 1.4 * (1 - k) + 0.3, k < 0.5 ? C[3] : C[2]);
  });
}
