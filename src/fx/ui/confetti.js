import { PAL, ramp, burst, fly, seg, scale, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Confetti",
  desc: "Two party poppers fire from the lower corners: bright paper bits and curly streamers shoot up, stall, then flutter down tumbling, flashing their backs.",
  tags: ["ui", "confetti", "celebrate", "party", "reward", "one-shot"],
  size: [112, 88],
  origin: [56, 84],
  duration: 2.6,
  loop: false,
  fps: 30,
  bg: "dark",
  // hues, not a ramp: each bit takes one and shades its back side darker
  options: { palette: PAL.candy, count: 36, seed: 17 },
};

export function draw(p, t, o) {
  const C = ramp(o.palette), S = o.seed, n = o.count;
  for (const side of [-1, 1]) {
    const x0 = side * 50, y0 = -2;
    // the popper's flash
    if (t < 0.1) {
      p.circle(x0 - side * 1, y0 - 3, 4 - t * 30, WHITE);
      p.glow(x0, y0 - 4, 16, C[2], 0.6 * (1 - t / 0.1));
    }
    burst(n, S + (side > 0 ? 100 : 0), (r, i) => {
      const life = r.range(1.7, 2.5), age = t - r.range(0, 0.06);
      if (age < 0 || age > life) return;
      // up and inward, fast; air drag takes the speed, then they drift down slowly
      const a = -Math.PI / 2 - side * r.range(0.12, 0.95), sp = r.range(220, 430);
      let [x, y] = fly(x0, y0, Math.cos(a) * sp, Math.sin(a) * sp, age, 120, r.range(4.6, 5.6));
      if (y > -1 && age > 0.2) return; // landed
      const slow = seg(age, 0.3, 0.9), ph = r.next() * TAU;
      x += Math.sin(age * r.range(5, 8) + ph) * 4 * slow; // flutter side to side once they stall
      if (age > life - 0.3 && Math.floor(age * 30) % 2) return; // blink out at the end
      const c = C[Math.floor(r.next() * C.length)], dark = scale(c, 0.55);
      const X = Math.round(x), Y = Math.round(y);
      if (i % 7 === 0) {
        // a curly streamer: a short wave trailing behind its head
        for (let k = 0; k < 8; k++) p.px(X + Math.round(Math.sin(age * 10 + k * 1.1) * 1.6), Y - k, k % 3 === 2 ? dark : c);
        return;
      }
      // a paper bit tumbling: flat, edge-on, turned, edge-on; its back is darker
      const turn = Math.floor(age * r.range(10, 18) + ph * 4) % 4, size = i % 3 === 0 ? 3 : 2;
      const [w, h] = turn === 0 ? [size + 1, 2] : turn === 2 ? [2, size + 1] : [2, 2];
      p.rect(X, Y, w, h, turn < 2 ? c : dark);
    });
  }
}
