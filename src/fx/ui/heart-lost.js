import { PAL, burst, seg, ease, WHITE } from "../../core/index.js";
import { Layer, fit } from "./_lib.js";
import { pillow, heartSdf } from "../pickups/_lib.js";

export const meta = {
  name: "Heart lost",
  desc: "A HUD heart takes the hit: it flashes and squashes, a crack zigzags down it, then it snaps in two and the halves tumble apart and fall, shards flying.",
  tags: ["ui", "heart", "life", "damage", "hud", "one-shot"],
  size: [56, 52],
  origin: [28, 20],
  duration: 1.1,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.blood, seed: 15 },
};

const L = new Layer(40, 40);
const HIT = 0.08, CRACK = 0.22, SPLIT = 0.42;
// the crack: a zigzag down the middle, as an x offset per row
const ZIG = [0, -1, 1, -1, 1, 0, -1, 1, 0, -1, 0, 1, 0, 0, 0, 0];
const crackX = (y) => ZIG[Math.max(0, Math.min(ZIG.length - 1, Math.floor(y) + 7))];

function heart(C, squash, flash) {
  L.begin(-20, -20);
  pillow(L, -10, -9, 10, 9, (x, y) => heartSdf(x, y, 0, 0, 7.5 * (1 + squash), 7.5 * (1 - squash)), (b, e) => {
    if (flash) return e < 1 ? C[6] : WHITE;
    if (b > 0.93 && e > 1) return WHITE;
    return b > 0.8 ? C[6] : b > 0.55 ? C[5] : b > 0.3 ? C[4] : b > 0.1 ? C[3] : C[2];
  }, { bevel: 3.5 });
}

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed;
  const flash = t >= HIT && t < HIT + 0.07, squash = t >= HIT && t < HIT + 0.12 ? 0.18 : 0;
  const jx = t >= HIT && t < SPLIT ? Math.round(Math.sin(t * 90) * 1.5 * (1 - seg(t, HIT, SPLIT))) : 0;
  heart(C, squash, flash);
  // the crack runs down from the top notch
  const ck = seg(t, CRACK, CRACK + 0.12);
  if (ck > 0) for (let y = -7; y <= -7 + 15 * ck; y++) if (L.get(crackX(y), y)) L.set(crackX(y), y, C[0]);
  L.outline(C[1]);
  if (t < SPLIT) {
    L.draw(p, jx, 0);
    if (flash) p.glow(0, 0, 18, C[5], 0.5);
    return;
  }
  // split: each half tumbles away, turning about its own middle, and blinks out as it falls. The halves are
  // re-shaded where they land rather than rotated as pixels, so they stay crisp at any angle.
  const age = t - SPLIT;
  if (age > 0.62 || (age > 0.45 && Math.floor(t * 30) % 2)) return;
  L.begin(-20, -20);
  for (const side of [-1, 1]) {
    const dx = side * (2 + 22 * age), dy = -12 * age + 70 * age * age, ang = side * 1.1 * ease.outQuad(Math.min(1, age / 0.6));
    const px = side * 4, cs = Math.cos(-ang), sn = Math.sin(-ang);
    const toHeart = (x, y) => {
      const ux = x - px - dx, uy = y - dy;
      return [px + ux * cs - uy * sn, ux * sn + uy * cs];
    };
    const sdf = (x, y) => heartSdf(...toHeart(x, y), 0, 0, 7.5, 7.5);
    const clip = (x, y) => {
      const [hx, hy] = toHeart(x, y);
      return side < 0 ? hx > crackX(hy) : hx < crackX(hy) + 1;
    };
    pillow(L, -19, -19, 19, 19, sdf, (b, e) => (b > 0.93 && e > 1 ? WHITE : b > 0.8 ? C[6] : b > 0.55 ? C[5] : b > 0.3 ? C[4] : b > 0.1 ? C[3] : C[2]), { bevel: 3.5, clip });
  }
  L.outline(C[1]);
  L.draw(p);
  // shards spit out of the break
  burst(5, S, (r, i) => {
    const life = r.range(0.3, 0.5);
    if (age > life) return;
    const vx = r.range(-40, 40), vy = -r.range(30, 70), sy = r.range(-6, 6);
    p.rect(Math.round(crackX(sy) + vx * age), Math.round(sy + vy * age + 150 * age * age), i % 3 ? 1 : 2, 1, age / life < 0.4 ? C[6] : C[4]);
  });
  if (age < 0.1) p.glow(0, 0, 16, C[5], 0.4 * (1 - age / 0.1));
}
