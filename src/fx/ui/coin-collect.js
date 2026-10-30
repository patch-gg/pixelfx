import { PAL, hex, burst, fly, seg, ease, WHITE } from "../../core/index.js";
import { boldText, twinkle, fit } from "./_lib.js";

export const meta = {
  name: "Coin collect",
  desc: "Coins pop out of a pickup and hop, then streak up into the HUD counter one by one; the icon flashes and the number ticks up and bumps with each.",
  tags: ["ui", "coin", "collect", "counter", "hud", "money", "one-shot"],
  size: [96, 72],
  origin: [56, 64],
  duration: 1.55,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.gold, count: 5, from: 12, seed: 18 },
};

// a small spinning coin: face, three-quarter, edge; k outline, a rim, b face, c shine
const COIN = [
  ["..kkk..", ".kaaak.", "kabbbak", "kabcbak", "kabbbak", ".kaaak.", "..kkk.."],
  [".kkk.", "kaaak", "kabak", "kacak", "kabak", "kaaak", ".kkk."],
  [".k.", "kak", "kak", "kak", "kak", "kak", ".k."],
];
const IX = -44, IY = -52; // the HUD coin icon's center
const INK = hex("#0b0a10"), PLATE = [hex("#1f1b2b"), hex("#3a3450")];

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, pal = { k: C[1], a: C[3], b: C[5], c: WHITE };
  let got = 0, lastHit = -1;
  // each coin: pops out and hops, then homes in on the icon, faster and faster
  burst(o.count, S, (r, i) => {
    const t0 = i * 0.035, th = 0.3 + i * 0.075, tArrive = th + 0.3;
    if (t >= tArrive) {
      got++;
      lastHit = Math.max(lastHit, tArrive);
      return;
    }
    if (t < t0) return;
    const vx = (i - (o.count - 1) / 2) * 22 + r.range(-8, 8), vy = -r.range(110, 150);
    let x, y;
    if (t < th) [x, y] = fly(0, -4, vx, vy, t - t0, 330);
    else {
      const [hx, hy] = fly(0, -4, vx, vy, th - t0, 330), k = ease.inQuad(seg(t, th, tArrive));
      const cx = hx + (IX - hx) * 0.2, cy = Math.min(hy, IY) - 18; // bow the path up and over
      x = (1 - k) * (1 - k) * hx + 2 * (1 - k) * k * cx + k * k * IX;
      y = (1 - k) * (1 - k) * hy + 2 * (1 - k) * k * cy + k * k * IY;
      // a short streak behind it as it speeds up
      if (k > 0.3) p.line(x + (hx - IX) * 0.08, y + (hy - IY) * 0.04 + 2, x, y, C[4]);
    }
    const spin = COIN[[0, 1, 2, 1][Math.floor(t * 18 + i) % 4]], w = spin[0].length;
    p.sprite(spin, pal, Math.round(x) - (w >> 1), Math.round(y) - 3);
    p.light(x, y, C[5], 0.3);
  });
  // the HUD: the icon flashes and the number bumps as each coin lands; it all blinks away at the end
  const end = seg(t, 1.3, 1.52);
  if (end >= 1 || (end > 0 && Math.floor(t * 30) % 2)) return;
  const hit = lastHit >= 0 && t - lastHit < 0.1, pop = hit ? 1 : 0;
  // a little HUD plate slides down into place behind the counter
  const drop = Math.round(-3 * (1 - ease.outBack(seg(t, 0, 0.12), 1.6)));
  const plateW = 12 + p.measure(String(o.from + got), { font: "big" })[0] + 4;
  p.rect(IX - 7, IY - 7 + drop, plateW + 2, 14, INK);
  p.rect(IX - 6, IY - 6 + drop, plateW, 12, PLATE[0]);
  p.rect(IX - 6, IY - 6 + drop, plateW, 1, PLATE[1]);
  if (drop) return;
  p.sprite(COIN[0], hit ? { k: C[1], a: WHITE, b: WHITE, c: WHITE } : pal, IX - 3, IY - 3 - pop);
  if (hit) p.glow(IX, IY, 12, C[5], 0.6);
  const n = String(o.from + got);
  boldText(p, n, IX + 6, IY - 4 - pop, hit ? WHITE : (gx, gy) => (gy < 2 ? WHITE : gy < 5 ? C[6] : C[5]), { outline: C[1], shadow: C[0], align: "left" });
  if (hit) twinkle(p, IX + 4, IY - 5, 2, C[5], C[6]);
}
