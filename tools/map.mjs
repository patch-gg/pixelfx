#!/usr/bin/env node
// Preview a fantasy map: its whole canvas, its gameplay layout and a hero at the spawn point.
//
//   node tools/map.mjs world/mossy-ruins
//   node tools/map.mjs world/ember-depths --gif
//
// Writes records/<id>/contact.png, layout.png and gameplay.png. The layout image overlays the walkable span,
// ground line, bounds, spawn points and platforms from the module's `map` export, so a map cannot be authored with
// its gameplay metadata pointing somewhere the art isn't.

import { join } from "node:path";
import { ROOT, resolveIds, loadEffect, renderFrames, contactSheet, save, canvas, upscale, writeVideo } from "./lib/fxlib.mjs";
import { createFrame, clearFrame, createFx, composite, painterFor, drawActor, stockActor } from "../src/core/index.js";

const args = process.argv.slice(2), flags = {}, ids = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith("--")) ids.push(a);
  else if (["gif", "mp4"].includes(a.slice(2))) flags[a.slice(2)] = true;
  else flags[a.slice(2)] = args[++i];
}
if (!ids.length) {
  console.error("usage: node tools/map.mjs <world/map-id> [--gif] [--mp4] [--out DIR]");
  process.exit(1);
}

function problems(fx) {
  const out = [], m = fx.mod.map, meta = fx.meta, [W, H] = meta.size;
  if (!m) return ["no map export: a map module needs groundY, walk and spawns for the game to stand on"];
  if (meta.kind !== "map") out.push(`meta.kind is "${meta.kind ?? "effect"}", expected "map"`);
  if (meta.actor) out.push("a map should not declare an actor: units are placed by the encounter");
  if (!meta.loop) out.push("a map is a loop: set meta.loop = true");
  if (!(m.groundY >= H * 0.45 && m.groundY < H)) out.push(`map.groundY ${m.groundY} is not in the lower half of a ${W}x${H} canvas`);
  if (!Array.isArray(m.walk) || !m.walk.length) out.push("map.walk is empty");
  for (const [a, b] of m.walk ?? []) {
    if (!(a >= 0 && b <= W && b > a)) out.push(`map.walk span [${a}, ${b}] is outside the canvas`);
    if (m.groundY === undefined) out.push("map.groundY missing");
  }
  for (const [name, p] of Object.entries(m.spawns ?? {})) {
    for (const q of Array.isArray(p[0]) ? p : [p]) {
      if (!(q[0] >= 0 && q[0] <= W && q[1] >= 0 && q[1] <= H)) out.push(`map.spawns.${name} ${q} is outside the canvas`);
      else if (Math.abs(q[1] - m.groundY) > 4) out.push(`map.spawns.${name} ${q} is ${Math.abs(q[1] - m.groundY)} px off the ground (${m.groundY})`);
      else if (!(m.walk ?? []).some(([a, b]) => q[0] >= a && q[0] <= b)) out.push(`map.spawns.${name} ${q} is not over a walkable span`);
    }
  }
  for (const p of m.platforms ?? []) {
    if (!(p[0] >= 0 && p[0] + p[2] <= W && p[1] > 0 && p[1] < m.groundY)) out.push(`map.platforms entry [${p}] is outside the map or below the ground`);
  }
  return out;
}

for (const id of resolveIds(ids)) {
  const fx = await loadEffect(id);
  if (!fx.mod.map) {
    console.error(`${id}: no map export (is this a map?)`);
    process.exitCode = 1;
    continue;
  }
  const bad = problems(fx);
  if (bad.length) {
    console.error(`${id}:`);
    for (const p of bad) console.error(`  - ${p}`);
    process.exitCode = 1;
    continue;
  }
  const m = fx.mod.map, [W, H] = fx.meta.size;
  const r = renderFrames(fx, { fps: flags.fps ? +flags.fps : undefined, seed: flags.seed ? +flags.seed : undefined });
  const dir = join(flags.out ?? join(ROOT, "records"), id);
  const made = [save(join(dir, "contact.png"), contactSheet(fx, r, { max: +(flags.max ?? 4), zoom: flags.zoom ? +flags.zoom : undefined }))];

  // a 2x map with the gameplay layout drawn over it
  const k = 2, img = canvas(W * k, H * k, [6, 6, 10, 255]);
  img.paste(upscale(r.frames[0].color, W, H, k), W * k, H * k, 0, 0);
  const gy = Math.round(m.groundY * k);
  for (const [a, b] of m.walk) {
    img.rect(Math.round(a * k), gy - 1, Math.round((b - a) * k), 2, [255, 212, 90, 150]);
  }
  img.rect(0, gy, W * k, 1, [255, 212, 90, 80]);
  for (const [name, p] of Object.entries(m.spawns)) {
    const list = Array.isArray(p[0]) ? p : [p];
    list.forEach(([x, y], i) => {
      const X = Math.round(x * k), Y = Math.round(y * k);
      img.rect(X - 3, Y - 3, 7, 7, name === "hero" ? [120, 220, 255, 230] : name === "boss" ? [255, 90, 90, 230] : [255, 180, 80, 230]);
      img.text(`${name}${list.length > 1 ? i + 1 : ""}`, X + 5, Y - 12, 1, [235, 230, 245]);
    });
  }
  for (const [i, p] of (m.platforms ?? []).entries()) {
    img.rect(Math.round(p[0] * k), Math.round(p[1] * k), Math.round(p[2] * k), 2, [100, 230, 160, 200]);
    img.text(`platform ${i + 1}`, Math.round(p[0] * k) + 3, Math.round(p[1] * k) - 10, 1, [180, 250, 210]);
  }
  img.text(`${id}  ${W}x${H}  ground ${m.groundY}  walk ${m.walk.length}  spawns ${Object.keys(m.spawns).length}`, 6, 5, 2, [235, 230, 245]);
  made.push(save(join(dir, "layout.png"), img.png()));

  // the map as a player sees it, with the stock hero standing at the hero spawn
  const f = createFrame(W, H), inst = createFx(fx.mod, { x: 0, y: 0 });
  for (let i = 0; i < 30; i++) inst.update(1 / 30);
  clearFrame(f);
  inst.draw(f);
  const spawn = m.spawns.hero ?? [m.walk[0][0] + 20, m.groundY];
  drawActor(painterFor(f).place(spawn[0], spawn[1]), stockActor(2), 1);
  const rgba = composite(f, new Uint8ClampedArray(W * H * 4), null);
  made.push(save(join(dir, "gameplay.png"), upscaleCanvas(rgba, W, H, 2)));

  if (flags.gif) writeVideo(join(dir, "anim.gif"), r, 2, { loops: 2 });
  if (flags.mp4) writeVideo(join(dir, "anim.mp4"), r, 2, { loops: 2 });
  console.log(`${id}  ${fx.meta.size[0]}x${fx.meta.size[1]}  ${r.n} frames  ->  ${made.join("  ")}`);
}

function upscaleCanvas(rgba, w, h, k) {
  const c = canvas(w * k, h * k, [0, 0, 0, 0]);
  c.paste(upscale(rgba, w, h, k), w * k, h * k, 0, 0);
  return c.png();
}
