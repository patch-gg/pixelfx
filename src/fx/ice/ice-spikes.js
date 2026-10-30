import { PAL, burst, rng, seg, ease, fly, TAU, WHITE } from "../../core/index.js";
import { fit, spike, shard, shardPts, glint } from "./_lib.js";

export const meta = {
  name: "Ice spikes",
  desc: "A row of ice spikes bursts out of the ground one after another to the right, each taller than the last, then shatters into tumbling shards.",
  tags: ["ice", "spikes", "frost", "ground", "attack", "directional", "one-shot"],
  size: [144, 64],
  origin: [14, 56],
  duration: 1.5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.ice, count: 6, spacing: 18, seed: 21 },
};

export function draw(p, t, o) {
  const I = fit(o.palette), S = o.seed, n = o.count;
  for (let i = 0; i < n; i++) {
    const r = rng(S, i), x = 8 + i * o.spacing + r.range(-2, 2), h = 14 + i * 6 + r.range(-2, 2);
    const born = 0.03 + i * 0.06, brk = 0.74 + i * 0.045, age = t - born;
    if (age < 0) continue;
    const up = ease.outBack(seg(age, 0, 0.12), 2.2), broken = t >= brk;
    // the frost slab it stands on, melting away after it breaks
    const slab = (6 + h * 0.3) * (1 - ease.inQuad(seg(t, brk + 0.05, brk + 0.4)));
    if (slab > 1) {
      p.ellipse(x, 0.5, slab, 1.8, (d, a) => (d > 0.75 ? I[4] : Math.sin(a) < 0 ? I[6] : I[5]));
    }
    const w = 2.5 + h * 0.1, lean = h * 0.1, flash = broken && t - brk < 0.034;
    if (!broken || flash) {
      // a smaller spike leaning back behind, the main spike, a stubby one leaning forward in front
      const J = flash ? Array(8).fill(WHITE) : I;
      spike(p, x - w * 0.9, 0, w * 0.6, h * 0.55 * up, -h * 0.22, J);
      spike(p, x, 0, w, h * up, lean, J);
      spike(p, x + w * 0.9, 0, w * 0.55, h * 0.4 * up, h * 0.25, J);
      // a glint runs up the ridge while it stands
      const g = seg(t, born + 0.2, born + 0.55);
      if (!flash && g > 0 && g < 1) glint(p, x + w * 0.2 + lean * g, -h * g * 0.9, g < 0.5 ? 2 : 1, I[6], WHITE);
    }
    // the burst out of the ground: a flash, chips and frost powder
    if (age < 0.06) {
      p.ellipse(x, -1, 6 + h * 0.15, 2.5, WHITE);
      p.glow(x, -h * 0.4, h * 0.9, I[5], 0.4);
    }
    burst(5, S + i * 7, (rr) => {
      const life = rr.range(0.25, 0.4);
      if (age > life) return;
      const [cx, cy] = fly(x + rr.range(-4, 4), -1, rr.range(-50, 60), -rr.range(40, 110), age, 400);
      p.px(cx, Math.min(0, cy), age / life < 0.5 ? I[7] : I[5]);
    });
    // shattering: the spike breaks into shards that tumble and fall away
    if (broken && !flash) {
      const b = t - brk;
      burst(5, S + 100 + i, (rr, j) => {
        const life = rr.range(0.3, 0.42);
        if (b > life) return;
        const k = b / life, hy = -h * rr.range(0.1, 0.9), pts = shardPts(rr, (2.2 + h * 0.07) * (1 - 0.5 * seg(k, 0.5, 1)));
        const [sx, sy] = fly(x + rr.range(-w, w) + lean * (-hy / h), hy, rr.sign() * rr.range(25, 60), -rr.range(10, 50), b, 520, 1.4);
        if (sy > 1) return;
        shard(p, sx, sy, pts, rr.range(0, TAU) + b * rr.range(-12, 12), I, 1 - seg(k, 0.75, 1));
      });
      if (b < 0.07) p.glow(x, -h * 0.5, h, I[6], 0.3);
    }
  }
  // a cold light following the eruption
  p.glow(40, -20, 70, I[4], 0.1 * seg(t, 0.03, 0.2) * (1 - seg(t, 0.9, 1.3)));
}
