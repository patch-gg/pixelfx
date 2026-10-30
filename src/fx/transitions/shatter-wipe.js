import { PAL, hex, ease, seg, clamp, lerp, rand, burst, fly, TAU, WHITE } from "../../core/index.js";
import { screenMeta, screen, fill, onScreen, clipLine, W, H, accents } from "./_lib.js";

export const meta = screenMeta({
  name: "Shatter wipe",
  desc: "A dark pane drops over the screen, cracks race out from an impact with a flash, and the glass breaks into glinting shards that tumble away.",
  tags: ["shatter", "glass", "break", "wipe"],
  duration: 2,
  options: { palette: PAL.ice, rays: 12 },
});

// where a ray from (cx, cy) leaves the screen, and on which side (0 top, 1 right, 2 bottom, 3 left)
function exit(cx, cy, a) {
  const dx = Math.cos(a), dy = Math.sin(a);
  let best = Infinity, side = 0;
  if (dy < 0 && -cy / dy < best) (best = -cy / dy), (side = 0);
  if (dx > 0 && (W - cx) / dx < best) (best = (W - cx) / dx), (side = 1);
  if (dy > 0 && (H - cy) / dy < best) (best = (H - cy) / dy), (side = 2);
  if (dx < 0 && -cx / dx < best) (best = -cx / dx), (side = 3);
  return { d: best, side };
}
const CORNER = [[W, 0], [W, H], [0, H], [0, 0]]; // the corner after each side, going clockwise

// a crack from a to b with a kink or two, the same for both shards that share it
function jag(seed, id, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), m = L > 22 ? 2 : 1, out = [a];
  for (let k = 1; k <= m; k++) {
    const f = k / (m + 1) + (rand(seed, id, k, 1) - 0.5) * 0.15, off = (rand(seed, id, k, 2) - 0.5) * Math.min(10, L * 0.28);
    out.push([a[0] + dx * f - (dy / (L || 1)) * off, a[1] + dy * f + (dx / (L || 1)) * off]);
  }
  out.push(b);
  return out;
}

// the break: jagged rays out of the impact, crossed by rings that follow the screen's shape (cached per seed)
const cache = new Map();
function pattern(seed, NR) {
  const key = seed + ":" + NR;
  if (cache.has(key)) return cache.get(key);
  const cx = W * (0.38 + 0.14 * rand(seed, 1)), cy = H * (0.34 + 0.18 * rand(seed, 2));
  const F = [0, 0.17, 0.4, 0.68, 1], J = F.length - 1;
  const rays = [];
  for (let i = 0; i < NR; i++) {
    const a = ((i + (rand(seed, i, 3) - 0.5) * 0.55) / NR) * TAU, ex = exit(cx, cy, a);
    const vs = F.map((f, j) => {
      const r = j === 0 ? 0 : j === J ? ex.d : ex.d * f * (0.82 + 0.36 * rand(seed, i, j, 4));
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
    rays.push({ vs, side: ex.side });
  }
  // radial cracks rad[i][j]: ring j to j+1 along ray i; ring cracks ring[i][j]: ray i to ray i+1 on ring j
  const rad = rays.map((ray, i) => F.slice(0, J).map((_, j) => jag(seed, i * 10 + j, ray.vs[j], ray.vs[j + 1])));
  const ring = rays.map((ray, i) => F.map((_, j) => (j === 0 || j === J ? null : jag(seed, 500 + i * 10 + j, ray.vs[j], rays[(i + 1) % NR].vs[j]))));
  const shards = [];
  for (let i = 0; i < NR; i++) {
    const i1 = (i + 1) % NR;
    for (let j = 0; j < J; j++) {
      const pts = [];
      if (j > 0) pts.push(...ring[i][j].slice(0, -1));
      pts.push(...rad[i1][j].slice(0, -1));
      if (j + 1 === J) {
        // the outer shard follows the screen's border round any corners between its rays
        pts.push(rays[i1].vs[J]);
        for (let s = rays[i1].side; s !== rays[i].side; s = (s + 3) % 4) pts.push(CORNER[(s + 3) % 4]);
      } else pts.push(...ring[i][j + 1].slice(1).reverse());
      pts.push(...rad[i][j].slice(1).reverse());
      const mx = pts.reduce((s, v) => s + v[0], 0) / pts.length, my = pts.reduce((s, v) => s + v[1], 0) / pts.length;
      const r = (k) => rand(seed, i, j, 7, k), near = clamp(Math.hypot((mx - cx) / W, (my - cy) / H) * 1.7);
      shards.push({
        pts, mx, my, start: 0.53 + 0.1 * near + 0.03 * r(1),
        vx: (mx - cx) * 0.7 + (r(2) - 0.5) * 30, vy: -25 * r(3) + (my - cy) * 0.4, spin: (r(4) - 0.5) * 6, ph: r(5) * TAU,
      });
    }
  }
  // rasterize every shard once: a mask with its edges marked (1 faces up-left, 2 the rest), and which shard
  // owns each screen pixel
  const owner = new Int16Array(W * H).fill(-1);
  shards.forEach((sh, si) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of sh.pts) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W - 1, Math.ceil(x1)); y1 = Math.min(H - 1, Math.ceil(y1));
    const w = x1 - x0 + 1, h = y1 - y0 + 1, m = new Uint8Array(w * h), n = sh.pts.length;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const px = x0 + x + 0.5, py = y0 + y + 0.5;
        let inside = false;
        for (let a = 0, b = n - 1; a < n; b = a++) {
          const [xa, ya] = sh.pts[a], [xb, yb] = sh.pts[b];
          if (ya > py !== yb > py && px < ((xb - xa) * (py - ya)) / (yb - ya) + xa) inside = !inside;
        }
        if (inside) (m[y * w + x] = 1), (owner[(y0 + y) * W + x0 + x] = si);
      }
    const In = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] > 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (m[y * w + x]) m[y * w + x] = !In(x, y - 1) || !In(x - 1, y) ? 2 : !In(x, y + 1) || !In(x + 1, y) ? 3 : 1;
    Object.assign(sh, { x0, y0, w, h, m });
  });
  // a pixel center that no shard claimed (right on a crack) goes to its neighbour
  for (let i = 0; i < owner.length; i++) if (owner[i] < 0) owner[i] = owner[i - 1] ?? owner[i - W] ?? 0;
  const v = { cx, cy, rad, ring, shards, J, F, NR, owner };
  cache.set(key, v);
  return v;
}

export function draw(p, t, o) {
  const C = accents(o.palette), ink = hex(o.color), n = C.length, D = meta.duration, u = t / D, S = o.seed;
  if (u >= 1) return;
  const { cx, cy, rad, ring, shards, J, F, NR, owner } = pattern(S, Math.max(5, o.rays | 0));
  const glint = C[n - 2], edge = C[n - 3], dark = C[Math.min(1, n - 1)], deep = C[0];
  // 1. the pane drops in, lands with one small bounce; a faint sheen rides on it
  if (u < 0.44) {
    const s = seg(u, 0.04, 0.4), yb = H * (s < 0.72 ? (s / 0.72) ** 2 : 1 - 0.07 * Math.sin((Math.PI * (s - 0.72)) / 0.28));
    if (yb < 0.5) return;
    const sheen = 1 - seg(u, 0.3, 0.4);
    screen(p, (x, y, o2) => {
      if (y > yb) return;
      const q = x - 30 - (y - yb + H) * 0.75;
      if ((q > 0 && q < 6) || (q > 10 && q < 12)) {
        if (sheen <= 0) return ink;
        // the sheen dithers away once the pane has landed (drawn twice: ink under, sheen over)
        return Math.floor(x) % 2 === Math.floor(y) % 2 || sheen > 0.5 ? dark : ink;
      }
      return ink;
    });
    if (yb < H - 0.5) p.rect(0, Math.floor(yb), W, 1, edge);
    return;
  }
  // 2. a brief hold, then the cracks race out from the impact
  if (u < 0.53) {
    fill(p, ink);
    const c = ease.outQuart(seg(u, 0.44, 0.5));
    if (c <= 0) return;
    const hot = u < 0.48;
    for (let i = 0; i < NR; i++)
      for (let j = 0; j < J; j++) {
        if (c <= F[j]) break;
        const k = clamp((c - F[j]) / (F[j + 1] - F[j])), path = rad[i][j];
        // draw the crack only as far as it has run
        const segs = path.length - 1, upto = k * segs;
        for (let q = 0; q < segs && q < upto; q++) {
          const [x0, y0] = path[q], [x1, y1] = path[q + 1], f = clamp(upto - q);
          clipLine(p, x0, y0, lerp(x0, x1, f), lerp(y0, y1, f), hot ? WHITE : glint);
        }
      }
    // a few ring cracks join up behind them
    for (let i = 0; i < NR; i++)
      for (let j = 1; j < J; j++) {
        if (c < F[j] + 0.15 || rand(S, i, j, 9) > 0.55) continue;
        const path = ring[i][j];
        for (let q = 1; q < path.length; q++) clipLine(p, path[q - 1][0], path[q - 1][1], path[q][0], path[q][1], edge);
      }
    const fl = 1 - seg(u, 0.44, 0.48);
    if (fl > 0) {
      p.circle(cx, cy, 1 + 4 * fl, WHITE);
      p.glow(cx, cy, 34, C[n - 3], 0.7 * fl);
    }
    // glass dust puffs out of the impact
    burst(10, S + 3, (r) => {
      const age = (u - 0.44) * D, life = r.range(0.15, 0.3);
      if (age < 0 || age > life) return;
      const a = r.range(0, TAU), sp = r.range(30, 70), [x, y] = fly(cx, cy, Math.cos(a) * sp, Math.sin(a) * sp, age, 80, 4);
      if (onScreen(x, y)) p.px(x, y, age / life < 0.5 ? WHITE : glint);
    });
    return;
  }
  // 3. the glass falls: shards nearest the impact go first, tumbling and catching the light as they drop
  const fade = 1 - seg(u, 0.96, 1);
  screen(p, (x, y) => {
    const si = owner[Math.floor(y) * W + Math.floor(x)];
    if (u < shards[si].start) return ink;
  });
  // the cracks between shards still in place: radial ones, and the ring ones that showed when it broke
  const crack = (path) => {
    for (let q = 1; q < path.length; q++) clipLine(p, path[q - 1][0], path[q - 1][1], path[q][0], path[q][1], edge);
  };
  for (let i = 0; i < NR; i++)
    for (let j = 0; j < J; j++) {
      const a = shards[i * J + j], b = shards[((i + NR - 1) % NR) * J + j];
      if (u < a.start || u < b.start) crack(rad[i][j]);
      if (j > 0 && rand(S, i, j, 9) <= 0.55 && (u < a.start || u < shards[i * J + j - 1].start)) crack(ring[i][j]);
    }
  for (const s of shards) {
    if (u < s.start) continue;
    const a = (u - s.start) * D, th = s.spin * a, cs = Math.cos(th), sn = Math.sin(th);
    const ox = s.vx * a, oy = s.vy * a + 0.5 * 950 * a * a, px = s.mx + ox, py = s.my + oy;
    // where the shard's box lands, then each screen pixel there looks back into the shard's mask
    let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
    for (const [qx, qy] of [[s.x0, s.y0], [s.x0 + s.w, s.y0], [s.x0, s.y0 + s.h], [s.x0 + s.w, s.y0 + s.h]]) {
      const rx = qx - s.mx, ry = qy - s.my, X = px + rx * cs - ry * sn, Y = py + rx * sn + ry * cs;
      (X0 = Math.min(X0, X)), (X1 = Math.max(X1, X)), (Y0 = Math.min(Y0, Y)), (Y1 = Math.max(Y1, Y));
    }
    X0 = Math.max(0, Math.floor(X0)); Y0 = Math.max(0, Math.floor(Y0)); X1 = Math.min(W - 1, Math.ceil(X1)); Y1 = Math.min(H - 1, Math.ceil(Y1));
    if (X0 > X1 || Y0 > Y1) continue;
    // as a shard turns it flashes: a lighter fill and bright edges while it faces the light
    const face = Math.cos(th * 1.6 + s.ph), lit = face > 0.2;
    const fillC = face > 0.75 ? dark : lit ? deep : ink, upC = lit ? glint : edge, downC = lit ? edge : deep;
    for (let Y = Y0; Y <= Y1; Y++)
      for (let X = X0; X <= X1; X++) {
        const dx = X + 0.5 - px, dy = Y + 0.5 - py;
        const mx = Math.floor(s.mx + dx * cs + dy * sn) - s.x0, my = Math.floor(s.my - dx * sn + dy * cs) - s.y0;
        if (mx < 0 || my < 0 || mx >= s.w || my >= s.h) continue;
        const k = s.m[my * s.w + mx];
        if (k) p.dot(X, Y, k === 2 ? upC : k === 3 ? downC : fillC, fade);
      }
  }
}
