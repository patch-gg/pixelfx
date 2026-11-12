#!/usr/bin/env node
// Start a new effect from a template: node tools/new.mjs <category>/<name> [--loop]
//   node tools/new.mjs world/mossy-crypt --map            a battle map with a layout
// Writes src/fx/<category>/<name>.js and prints the next check/render commands.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { FX_DIR } from "./lib/fxlib.mjs";

const args = process.argv.slice(2);
const map = args.includes("--map");
const loop = args.includes("--loop");
let id = args.find((a) => !a.startsWith("--"));
if (!id) {
  console.error("usage: node tools/new.mjs <category>/<name> [--loop] [--map]");
  process.exit(1);
}
if (map && !id.includes("/")) id = `world/${id}`;
if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(id)) {
  console.error(`"${id}" is not kebab-case (category/name)`);
  process.exit(1);
}
const file = join(FX_DIR, id + ".js");
if (existsSync(file)) {
  console.error(`${file} already exists`);
  process.exit(1);
}
const name = id.split("/")[1].replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

if (map) {
  const src = `import { fit, hex, TAU } from "../../core/index.js";
import { bake, blit, sky, stars, ground, tufts, mist, fireflies, leaves, motes } from "./_lib.js";

export const meta = {
  name: "${name}",
  desc: "A one-line picture of this arena: its light, its floor and what moves in the background.",
  tags: ["map", "fantasy", "arena", "loop"],
  kind: "map",
  size: [320, 180],
  origin: [0, 0],
  duration: 8,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#05080d", "#08140f", "#0e2218", "#173522", "#26502c", "#3f7238", "#6aa04c", "#a8d97a"], seed: 1 },
};

/** The layout gameplay reads: feet stand on groundY, inside walk, at one of the spawns. */
export const map = {
  groundY: 150,
  bounds: [8, 312],
  walk: [[8, 312]],
  platforms: [],
  spawns: { hero: [52, 150], mobs: [[150, 150], [196, 150]], boss: [262, 150] },
  arena: { x0: 8, x1: 312, groundY: 150 },
};

const W = 320, H = 180, D = meta.duration;

export function create(o) {
  const C = fit(o.palette, 8), seed = o.seed ?? 1;
  const skyL = bake(W, H, (p) => {
    sky(p, W, H, hex("#05040c"), hex("#132134"), { horizon: 130, steps: 7 });
    stars(p, W, H, seed, 90, 112, "#cfc8ff");
    p.glow(252, 39, 60, C[3], 0.08);
  });
  const floorL = bake(W, H, (p) => {
    ground(p, W, 150, H, [hex("#141714"), hex("#090c09"), hex("#1b2118"), hex("#262e1d"), hex("#334226"), hex("#4a5c30"), hex("#6d8340")], { grass: true, seed });
    tufts(p, W, 150, C, seed + 4, 26);
    p.glow(160, 149, 40, C[4], 0.05);
  });
  let t = 0;
  return {
    update(dt) { t += dt; },
    draw(p) {
      const tt = t % D;
      blit(p, skyL);
      mist(p, tt, D, { y0: 90, y1: 142, color: "#a8c8c0", seed: seed + 2, bands: 2, alpha: 0.06 });
      blit(p, floorL);
      fireflies(p, tt, D, { count: 8, color: "#d8ff8a", seed: seed + 3 });
      leaves(p, tt, D, { count: 6, color: "#8fb45a", back: "#cfe49a", seed: seed + 5 });
      motes(p, tt, D, { count: 12, color: "#e8f0d0", seed: seed + 7 });
    },
  };
}
`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, src);
  console.log(`wrote ${file}\nnext:\n  node tools/check.mjs ${id}\n  node tools/map.mjs ${id}\n  node tools/index.mjs && node tools/check.mjs ${id}`);
  process.exit(0);
}

const body = loop
  ? `  // a loop: everything is a function of the phase, so t = 0 and t = duration match
  const C = ramp(o.palette), ph = t / meta.duration;
  cycle(t, meta.duration, 12, o.seed, 0.8, (age, life, r) => {
    const k = age / life, a = r.range(0, TAU) + ph * TAU, rad = 6 + k * 12;
    p.px(Math.cos(a) * rad, Math.sin(a) * rad - 8, at(C.slice(2), 1 - k));
  });
  p.circle(0, -8, 4 + Math.sin(ph * TAU) * 1.5, C[5]);
  p.glow(0, -8, 20, C[4], 0.35);`
  : `  // a one-shot: a hero frame, then everything falls away and is gone by t = duration
  const C = ramp(o.palette);
  if (t < 0.06) p.circle(0, -8, 6, WHITE);
  burst(14, o.seed, (r) => {
    const a = r.range(0, TAU), sp = r.range(40, 90), life = r.range(0.3, 0.6);
    if (t > life) return;
    const [x, y] = fly(0, -8, Math.cos(a) * sp, Math.sin(a) * sp, t, 120, 2);
    p.px(x, y, at(C.slice(2), 1 - t / life));
    p.light(x, y, C[4], 0.5 * (1 - t / life));
  });
  p.glow(0, -8, 24, C[4], 0.5 * (1 - seg(t, 0, 0.4)));`;
const src = `import { PAL, ramp, at, ${loop ? "cycle" : "burst, fly, seg, WHITE"}, TAU } from "../../core/index.js";

export const meta = {
  name: "${name}",
  desc: "One line: what it is, how it moves.",
  tags: ["${id.split("/")[0]}"],
  size: [48, 48],
  origin: [24, 32],
  duration: ${loop ? 1.2 : 0.7},
  loop: ${loop},
  fps: 30,
  bg: "dark",
  options: { palette: PAL.arcane, seed: 1 },
};

export function draw(p, t, o) {
${body}
}
`;
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, src);
console.log(`wrote ${file}\nnext: node tools/render.mjs ${id}   then look at records/${id}/contact.png\na character in it? give it an act: see "Acts" in docs/AUTHORING.md, then node tools/act.mjs ${id}`);
