// Static environment forms. Curves are sampled into hard pixel geometry; textures follow the material's mass.
// Keep these helpers inside bake(): none of the shape noise should change from frame to frame.
import { fit, lerp, mix, rand, noise2, TAU } from "../../core/index.js";

/** Catmull-Rom path through control points, with roughly one sample per local pixel and no antialiasing. */
export function contour(points) {
  if (points.length < 2) return points.map(([x, y]) => [x, y]);
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) * 1.5));
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => 0.5 * (2 * b[k] + (c[k] - a[k]) * t +
        (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3)));
    }
  }
  out.push([...points.at(-1)]);
  return out;
}

/** A solid, curved limb with a continuous taper, shaded volume and longitudinal bark grooves. Widths are diameters. */
export function limb(p, points, width, tip, colors, { seed = 1, bark = true } = {}) {
  const C = fit(colors, 5), path = contour(points);
  if (path.length < 2) return;
  const distances = [0];
  for (let i = 1; i < path.length; i++) distances.push(distances.at(-1) + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const length = distances.at(-1) || 1;
  const radius = i => lerp(width, tip, distances[i] / length) * 0.5;
  const ribbon = (scale, shift, color) => {
    const left = [], right = [];
    for (let i = 0; i < path.length; i++) {
      const before = path[Math.max(0, i - 1)], after = path[Math.min(path.length - 1, i + 1)];
      const dx = after[0] - before[0], dy = after[1] - before[1], n = Math.hypot(dx, dy) || 1;
      const r = Math.max(0.35, radius(i)), x = path[i][0] + shift * r, y = path[i][1];
      left.push([x - dy / n * r * scale, y + dx / n * r * scale]);
      right.push([x + dy / n * r * scale, y - dx / n * r * scale]);
    }
    p.poly([...left, ...right.reverse()], color);
  };
  ribbon(1, 0, C[0]);
  ribbon(0.83, -0.02, C[2]);
  ribbon(0.27, -0.4, C[3]);
  if (!bark || width < 5) return;
  for (let i = 0; i < Math.floor(width * 0.75); i++) {
    const first = Math.floor(rand(seed, i, 1) * (path.length - 1) * 0.8);
    const last = Math.min(path.length - 1, first + 5 + Math.floor(rand(seed, i, 2) * path.length * 0.24));
    const side = (rand(seed, i, 3) - 0.5) * 1.2;
    const groove = path.slice(first, last + 1).map(([x, y], j) => [x + side * radius(first + j), y]);
    p.polyline(groove, i % 4 === 0 ? C[4] : C[1]);
  }
}

/** An irregular rock with broad lit planes, a dark foot and connected fractures, rather than pixel speckle. */
export function rock(p, x, y, rx, ry, colors, { seed = 1, moss = null } = {}) {
  const C = fit(colors, 5), radii = Array.from({ length: 13 }, (_, i) => 0.82 + rand(seed, i, 1) * 0.23);
  p.shade(x - rx * 1.1, y - ry * 1.1, x + rx * 1.1, y + ry * 1.1, (px, py) => {
    const nx = (px - x) / rx, ny = (py - y) / ry, angle = ((Math.atan2(ny, nx) / TAU + 1) % 1) * radii.length;
    const sector = Math.floor(angle), edge = lerp(radii[sector], radii[(sector + 1) % radii.length], angle - sector);
    const r = Math.hypot(nx, ny);
    if (r > edge) return;
    const grain = noise2(px / 12, py / 9, seed), plane = -nx * 0.5 - ny * 0.9 + grain * 0.19;
    let step = plane > 0.7 ? 4 : plane > 0.28 ? 3 : plane > -0.35 ? 2 : 1;
    if (ny > 0.62 || (r > edge - 0.06 && ny > 0)) step = 0;
    // A seam cuts across a face and changes direction at the rock's internal planes.
    const seam = 0.12 + Math.sin(ny * 5 + seed) * 0.13 + Math.max(0, ny) * 0.4;
    if (ny > -0.55 && ny < 0.55 && Math.abs(nx - seam) < 0.65 / rx) step = Math.max(0, step - 2);
    if (grain > 0.48 && noise2(px / 3, py / 3, seed + 41) > 0.3) step = Math.max(1, step - 1);
    if (moss && ny < -0.35 && grain > 0.08 && plane > 0.1) return moss[grain > 0.4 ? 1 : 0];
    return C[step];
  });
}

function leafClump(p, x, y, rx, ry, C, seed) {
  const edge = Array.from({ length: 18 }, (_, i) => {
    const a = i / 18 * TAU, r = 0.72 + rand(seed, i, 6) * 0.3;
    return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r];
  });
  p.poly(edge, C[1]);
  for (let i = 0; i < 9; i++) {
    const bx = x + (rand(seed, i, 7) - 0.5) * rx * 1.35, by = y + (rand(seed, i, 8) - 0.5) * ry;
    const w = 2 + rand(seed, i, 9) * 4;
    p.poly([[bx - w, by], [bx - 1, by - 2], [bx + w, by - 1], [bx + 2, by + 2]], i % 3 ? C[2] : C[3]);
  }
}

/** A rooted, asymmetric marsh tree. Branches join at the trunk, broaden into roots and split before thinning. */
export function marshTree(p, x, base, h, width, colors, { seed = 1, lean = 8, crown = true, detail = true } = {}) {
  const C = fit(colors, 5), at = (dx, u) => [x + dx, base - h * u];
  const left = 0.24 + rand(seed, 0, 21) * 0.2, right = 0.2 + rand(seed, 0, 22) * 0.22;
  const lift = 0.76 + rand(seed, 0, 23) * 0.23, upper = 0.1 + rand(seed, 0, 24) * 0.16;
  const branches = [
    [at(lean * 0.4, 0.49), at(-h * left * 0.3, 0.61), at(-h * left * 0.72, lift - 0.12), at(-h * left, lift)],
    [at(lean * 0.5, 0.62), at(h * right * 0.38, 0.72), at(h * right * 0.85, lift - 0.03), at(h * right, lift + 0.08)],
    [at(lean, 0.78), at(-h * upper * 0.4, 0.9), at(-h * upper, 0.98 + rand(seed, 1, 25) * 0.14)],
    [at(lean * 0.9, 0.85), at(h * upper * 0.7, 0.95), at(h * upper * 1.3, 1.04 + rand(seed, 2, 25) * 0.13)],
  ];
  branches.forEach((pts, i) => {
    limb(p, pts, width * (0.5 - i * 0.07), 0.5, C, { seed: seed + i, bark: detail });
    const split = pts[pts.length - 2], end = pts.at(-1), dir = i % 2 ? 1 : -1;
    const twig = 5 + rand(seed, i, 26) * 9;
    limb(p, [split, [split[0] - dir * 2, split[1] - twig * 0.6], [split[0] + dir * twig * 0.3, split[1] - twig]], width * 0.15, 0.3, C, { bark: false });
  });
  limb(p, [at(0, 0), at(-width * 0.2, 0.2), at(lean * 0.5, 0.48), at(lean, 0.73), at(lean * 0.7, 1.06)], width, width * 0.09, C, { seed, bark: detail });
  for (let i = 0; i < 5; i++) {
    const dir = i % 2 ? 1 : -1, reach = width * (0.8 + rand(seed, i, 10) * 1.3);
    limb(p, [[x + dir * width * 0.15, base - h * 0.12], [x + dir * reach * 0.4, base - 4], [x + dir * reach, base + 1 + i % 2]], width * 0.28, 0.6, C, { seed: seed + i + 31, bark: detail });
  }
  if (crown) {
    for (const [i, pts] of branches.entries()) {
      const tip = pts.at(-1);
      leafClump(p, tip[0] + 2, tip[1] + 3, h * (0.13 + i % 2 * 0.025), h * 0.075, C, seed + i * 19);
      if (rand(seed, i, 27) > 0.4) leafClump(p, tip[0] - 8, tip[1] + 8, h * 0.1, h * 0.05, C, seed + i * 29);
    }
  }
  if (!detail) return;
  // Knots wrap with the grain, and moss hangs in sparse clumps from actual branch junctions.
  const knotY = base - h * 0.34, knotX = x + lean * 0.2;
  p.ellipse(knotX, knotY, width * 0.16, width * 0.24, C[0]);
  p.arc(knotX, knotY, width * 0.23, 1, 2, 4.6, C[3]);
  const mossPaths = branches.slice(0, 2).map(contour);
  for (let i = 0; i < 9; i++) {
    const path = mossPaths[i < 4 ? 0 : 1], k = 0.28 + rand(seed, i, 12) * 0.49;
    const [bx, by] = path[Math.floor(k * (path.length - 1))];
    const length = 5 + rand(seed, i, 13) * 11;
    const moss = [C[1], C[2], C[3], mix(C[3], C[4], 0.2), C[4]];
    limb(p, [[bx, by], [bx - 1, by + length * 0.5], [bx + 2, by + length]], 2, 0.5, moss, { bark: false });
  }
}

/**
 * A snow-capped mountain mass with one eroded skyline. `peaks` are [x, summitY, spread]; the mass fills to baseY
 * and is lit from the right, so lit faces keep their snow and shadow faces stay in rock. Snow settles above a
 * common snowline with tongues in the gullies. Returns `at(x)`, the skyline, for conifers and snow banks.
 */
export function massif(p, peaks, baseY, colors, { seed = 1, snowline = 96, snow = true, detail = true } = {}) {
  const C = fit(colors, 7);
  if (!peaks.length) return () => baseY;
  const x0 = Math.max(0, Math.floor(Math.min(...peaks.map(([x, , s]) => x - s))));
  const x1 = Math.min(p.w - 1, Math.ceil(Math.max(...peaks.map(([x, , s]) => x + s))));
  if (x1 < x0) return () => baseY;
  const sky = [], snap = [];
  for (let x = x0; x <= x1; x++) {
    let top = baseY;
    for (const [px, py, spread] of peaks) {
      const d = Math.abs(x - px) / spread;
      // Concave flanks: steep below the summit, easing into the valley.
      if (d < 1) top = Math.min(top, py + (baseY - py) * Math.pow(d, 0.9));
    }
    top += noise2(x * 0.11, 2.1, seed) * 2.4 + noise2(x * 0.3, 5.7, seed) * 1.1;
    sky.push(Math.round(Math.max(2, Math.min(baseY, top))));
    // One snowline for the whole mass, dipping into the gullies.
    let edge = snowline + noise2(x * 0.05, 1.2, seed) * 4 + noise2(x * 0.14, 7.7, seed) * 2;
    edge += Math.max(0, noise2(x * 0.23, 4.1, seed)) * 6;
    snap.push(edge);
  }
  const at = (x) => sky[Math.max(0, Math.min(sky.length - 1, Math.round(x) - x0))];
  // Normals come from a smoothed skyline, so one-pixel crags do not stripe the face with alternating light.
  const smooth = sky.map((_, i) => {
    let sum = 0, n = 0;
    for (let k = -5; k <= 5; k++) { sum += sky[Math.max(0, Math.min(sky.length - 1, i + k))]; n++; }
    return sum / n;
  });
  const normal = (i) => (smooth[Math.min(smooth.length - 1, i + 5)] - smooth[Math.max(0, i - 5)]);
  for (let i = 0; i < sky.length; i++) {
    const x = x0 + i, top = sky[i];
    if (top >= baseY) continue;
    // Light comes from the right: slopes that fall to the right are lit, whatever peak they belong to.
    const lit = normal(i) >= 0;
    const edge = snap[i], drop = baseY - top;
    for (let y = top; y < baseY; y++) {
      const d = y - top;
      let c;
      if (snow && y < edge) {
        c = lit ? C[6] : C[5];
        if (lit && d < 2) c = C[7];
        if (y > edge - 5) c = lit ? C[5] : C[4];
      } else if (snow && y > baseY - 5 - (noise2(x * 0.045, 13.1, seed) * 0.5 + 0.5) * 12) {
        // A snow apron ties the range into the valley floor.
        c = lit ? C[5] : C[4];
        if (y < baseY - 3) c = lit ? C[6] : C[5];
      } else {
        c = lit ? C[2] : C[1];
        if (d < 12) c = lit ? C[3] : C[2];
        if (d > drop * 0.6) c = lit ? C[1] : C[0];
        // Broad snow patches linger just below the snowline.
        if (snow && y < edge + 18 && noise2(x * 0.035, y * 0.025, seed + 17) > 0.55) c = lit ? C[5] : C[4];
      }
      if (snow && y > edge - 1 && y < edge + 1) c = lit ? C[7] : C[3];
      p.px(x, y, c);
    }
  }
  if (!detail || !snow) return at;
  // A few short snow tongues and rock outcrops keep the snowline from reading as a clean contour.
  for (const [px, , spread] of peaks) {
    for (let k = 0; k < 4; k++) {
      const sx = px + (rand(seed, px, k + 4) - 0.5) * spread * 0.66;
      const sy = Math.max(at(sx) + 3, snowline + (rand(seed, px, k + 8) - 0.5) * 6);
      if (sy > baseY - 6) continue;
      if (k === 3) p.poly([[sx - 2, sy], [sx + 2, sy - 2], [sx + 4, sy + 2], [sx, sy + 4]], C[3]);
      else if (k === 2) p.poly([[sx - 3, sy], [sx + 3, sy], [sx + 4, sy + 4], [sx, sy + 6], [sx - 4, sy + 4]], C[5]);
      else p.poly([[sx - 2, sy], [sx + 2, sy], [sx + 1, sy + 4], [sx - 1, sy + 5]], C[6]);
    }
  }
  return at;
}

/**
 * A conifer: a tapered, notched silhouette carrying drooping boughs, the moon side lit and snow caught on each
 * upper face. `colors` runs deep shadow, needle dark, needle lit, lit rim, snow shadow, snow light.
 * `detail: false` keeps a far tree as a compact silhouette.
 */
export function conifer(p, x, base, h, width, colors, { seed = 1, lean = 0, detail = true } = {}) {
  const C = fit(colors, 6);
  if (h < 8) {
    p.poly([[x - width * 0.4, base], [x, base - h], [x + width * 0.4, base]], C[1]);
    return;
  }
  const n = Math.max(3, Math.min(6, Math.round(h / 11))), tiers = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    tiers.push({
      cx: x + lean * t, y: base - h + h * (0.1 + 0.84 * t),
      half: Math.max(2, width * 0.5 * (0.16 + 0.84 * Math.pow(t, 0.95)) * (0.86 + rand(seed, i, 1) * 0.26)),
      droop: 2 + t * 3,
    });
  }
  const crown = [x + lean, base - h], left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = tiers[i], b = tiers[i + 1], tipY = Math.min(base, a.y + a.droop);
    left.push([a.cx - a.half, tipY]);
    right.push([a.cx + a.half, tipY]);
    if (b) {
      // The notch stays inside the bough above, so the outline tapers instead of pinching.
      left.push([a.cx - a.half * 0.42, tipY + 2]);
      right.push([a.cx + a.half * 0.42, tipY + 2]);
    }
  }
  const foot = [x + lean * 0.3, base];
  p.poly([crown, ...left, foot, ...right.slice().reverse()], C[1]);
  p.poly([crown, ...right, foot], C[2]);
  p.polyline([crown, ...right], C[3]);
  if (!detail) return;
  for (let i = 0; i < n; i++) {
    const a = tiers[i], tipY = Math.min(base, a.y + a.droop);
    // Not every bough keeps its load; bare branches show through the gaps.
    if (i > 0 && rand(seed, i, 3) > 0.74) continue;
    const inner = 0.5 + rand(seed, i, 2) * 0.26;
    const edge = contour([[a.cx - a.half * inner, tipY - 1], [a.cx - a.half * 0.38, a.y - 2], [a.cx, a.y - 3],
      [a.cx + a.half * 0.38, a.y - 2], [a.cx + a.half * inner, tipY - 1]]);
    const under = edge.slice().reverse().map(([sx, sy]) => {
      const thick = Math.abs(sx - a.cx) < a.half * 0.4 ? 3 : 1.6;
      return [sx, Math.min(tipY + 1, sy + thick)];
    });
    p.poly([...edge, ...under], C[4]);
    const cut = Math.floor(edge.length * 0.5);
    p.poly([...edge.slice(cut), ...under.slice(0, under.length - cut)], C[5]);
    // Needle tips stay exposed at the ends of the bough.
    p.px(a.cx - a.half * inner, tipY, C[3]);
    p.px(a.cx + a.half * inner, tipY, C[3]);
  }
  p.px(crown[0], crown[1] + 2, C[5]);
  p.px(crown[0], crown[1] + 3, C[5]);
  p.px(crown[0] + 1, crown[1] + 3, C[4]);
  // The foot keeps a dark notch where the trunk meets the snow.
  p.rect(x - 1, base - 4, 2, 5, C[0]);
  p.px(x - 2, base, C[1]);
  p.px(x + 1, base, C[1]);
}
