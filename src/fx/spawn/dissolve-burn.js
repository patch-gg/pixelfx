import { PAL, ramp, at, rand, stream, seg, noise, scale, TAU, WHITE } from "../../core/index.js";
import { actorOf, actorPixels, steps } from "./_lib.js";

export const meta = {
  name: "Dissolve burn",
  desc: "Burned away from the feet up: a ragged ember line climbs the body, charring it black just ahead, flames licking up, sparks and ash rising off.",
  tags: ["spawn", "death", "burn", "fire", "dissolve", "one-shot"],
  size: [48, 56],
  origin: [22, 50],
  duration: 2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: false,
  options: { palette: PAL.fire, seed: 28 },
};

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 8), S = o.seed, actor = actorOf(o), H = actor.h;
  const climb = seg(t, 0.12, 1.5), base = 3 - climb * (H + 7), frame = Math.floor(t * 30);
  const edge = (x) => base + noise(x * 0.5 + t * 1.5, S) * 1.8 + Math.sin(x * 1.7 + t * 11) * 0.45;
  const burning = climb > 0 && climb < 1;
  // the body: untouched above, a scorched rim, glowing bands, an ember edge; nothing below the line
  const cols = new Map();
  for (const q of actorPixels(actor, C)) {
    const d = q.y + 0.5 - edge(q.x + 0.5);
    if (d > 0.6) continue;
    let c = q.c;
    if (d > -0.5) c = noise(q.x * 0.8 + t * 9, S + 3) > 0.3 ? WHITE : at(C, 0.9);
    else if (d > -1.5) c = at(C, 0.6);
    else if (d > -2.5) c = at(C, 0.3);
    else if (d > -3.2) c = scale(q.c, 0.6);
    p.px(q.x, q.y, c);
    if (d > -1.5 && (!cols.has(q.x) || cols.get(q.x) > q.y)) cols.set(q.x, q.y);
  }
  // flames: a flickering tongue on each burning column
  if (burning)
    for (const [x, y] of cols) {
      const h = Math.round(1.2 + 2.6 * (0.5 + 0.5 * noise(x * 0.55 + t * 7, S + 5)) + rand(S, x, frame >> 1) * 0.9 - 0.6);
      for (let j = 1; j <= h; j++) p.px(x, y - j, j === 1 ? at(C, 0.78) : j === 2 ? at(C, 0.6) : at(C, 0.45));
    }
  // embers spat up off the line, swaying and cooling; flakes of ash drifting off slower
  stream(t, 0.15, 1.5, 22, S + 1, (r) => r.range(0.3, 0.45), (age, life, r, i) => {
    const t0 = 0.15 + i / 22, c0 = seg(t0, 0.12, 1.5), k = age / life;
    const x0 = r.range(-5, 5), y0 = Math.max(-H - 1, 3 - c0 * (H + 7)), ash = i % 3 === 0;
    const x = x0 + Math.sin(age * r.range(5, 9) + r.next() * TAU) * 2 + age * r.range(-4, 10), y = y0 - age * (ash ? r.range(10, 18) : r.range(22, 38));
    if (ash) return p.rect(x, y, 2, 1, k < 0.5 ? C[2] : C[1]);
    if (k > 0.6 && (frame + i) % 3 === 0) return;
    p.px(x, y, k < 0.3 ? at(C, 0.92) : k < 0.65 ? at(C, 0.7) : at(C, 0.45));
    p.light(x, y, at(C, 0.7), 0.35 * (1 - k));
  });
  // light: the burning line throws a warm pool that climbs with it
  if (burning) {
    const fl = 0.85 + 0.15 * rand(S, frame);
    p.glow(0, base, 20, at(C, 0.62), 0.42 * fl);
    p.glow(0, base, 7, at(C, 0.88), 0.3 * fl);
  }
}
