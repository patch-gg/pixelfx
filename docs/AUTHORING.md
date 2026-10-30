# Writing an effect

An effect is one file, `src/fx/<category>/<name>.js` (kebab-case), that draws pixel art as a function of
time. No images, no simulation state, no dependencies beyond `src/core`. Because a frame is just `draw(p, t)`,
an effect can be scrubbed, looped, recolored, mirrored and rendered to a sprite sheet for any engine.

```js
import { PAL, ramp, at, burst, fly, seg, ease, WHITE } from "../../core/index.js";

export const meta = {
  name: "Spark burst",                       // shown in the gallery
  desc: "White-hot sparks spray out, fall and cool to red.", // one line, under 180 chars
  tags: ["impact", "sparks", "one-shot"],
  size: [48, 48],                            // canvas in art pixels (sheets and previews)
  origin: [24, 30],                          // where local (0, 0) sits in that canvas
  duration: 0.6,                             // seconds; for a loop, its period
  loop: false,
  fps: 30,                                   // sheet frame rate
  bg: "dark",                                // preview backdrop: dark | ground | sky | light | black
  actor: false,                              // preview with the stock character standing at the origin
  options: { palette: PAL.volt, count: 12, seed: 1 }, // defaults; callers override any of them
};

export function draw(p, t, o) {
  const C = ramp(o.palette);
  burst(o.count, o.seed, (r) => {
    const a = r.range(0, Math.PI * 2), sp = r.range(40, 90), life = r.range(0.3, 0.55);
    if (t > life) return;
    const [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp - 20, t, 140, 2);
    p.px(x, y, at(C.slice(2), 1 - t / life));
    p.light(x, y, C[4], 0.5 * (1 - t / life));
  });
  if (t < 0.05) p.circle(0, 0, 3, WHITE);
}
```

## The contract

- **Coordinates are local**: (0, 0) is the effect's anchor: the feet of the character it wraps, the point of
  impact, the base of a torch, the muzzle of a gun. x goes right, y goes down, 1 unit is 1 art pixel. The
  painter places, mirrors (`flip`) and rotates (`angle`) the whole effect, so never hard-code screen positions.
- **Directional effects face right** (+x). Projectiles fly right, slashes swing to the right, breath blows right.
- **Ground effects** put the origin on the floor line: y = 0 is the ground surface. Nothing goes below y = 2
  except marks drawn on the floor (cracks, scorch, puddles).
- **Time**: `t` is seconds since the start. A one-shot runs 0..duration and must draw **nothing at
  t = duration**. A loop gets `0 <= t < duration` and must be **seamless**: the frame after the last is frame 0.
- **Options** `o`: `meta.options` merged with whatever the caller passes. Always honour `o.palette` (the main
  ramp, dark to bright) and `o.seed`. Add the knobs that matter for the effect (`size`, `count`, `radius`,
  `text`, `height`...) with defaults in `meta.options`. `x`, `y`, `flip`, `angle` and `light` are taken: they
  place the effect and set its glow, so name your own knobs something else (`cx`, `reach`, `glow`).
- **Deterministic**: never `Math.random()` or `Date`. Random numbers come from `burst`, `cycle`, `stream`,
  `rng(seed, i)` or `rand(...)`, which give the same values every frame.
- **Layers**: export `drawBack(p, t, o)` for what goes behind a character (auras, the far side of an orbit,
  portals behind a body) and `draw(p, t, o)` for the rest.
- **Actor effects** (`actor: true`) get `o.actor = { mask, x, y, w, h, head: [x, y], chest: [x, y] }`, the
  stock character's silhouette in local space with its feet at (0, 0): 12 x 19 px, head top at y = -19. Wrap,
  tint or outline the mask; previews draw the character, sheets don't. An effect that makes the character vanish
  or appear (a warp, a cloak) can export `actorAlpha(t, o)` returning 0..1, and previews dither the stand-in
  character by it; in a game, do the same to your own sprite.
- **State** (rare): if an effect truly needs simulation, export `create(o)` returning
  `{ update(dt), draw(p, t, o) }` instead of `draw`. Prefer closed-form motion (`fly`) first.

## Two buffers

A frame has a **color** buffer and a **light** buffer.

- **color**: opaque pixels only. Transparency is faked with ordered (Bayer) dithering: `p.dot(x, y, c, 0.5)`
  draws half the pixels in a stable pattern. Nothing is ever alpha-blended. This is what keeps it pixel art.
- **light**: additive glow, composited over everything: `p.glow`, `p.glowLine`, `p.glowRing`, `p.light`.
  Light is what makes things look hot or bright. Use it sparingly: k 0.2 to 0.6, a big soft glow plus a small
  tight one at the hottest point.

## Painter API

All coordinates local, floats fine (they snap to pixels). `c` is a color number; `a` is alpha 0..1 (dithered).
Where noted, `c` and `a` may be functions of the shape's own coordinates.

| call | draws |
|---|---|
| `p.px(x, y, c)` | one opaque pixel |
| `p.dot(x, y, c, a)` | one pixel at alpha a (dithered) |
| `p.line(x0, y0, x1, y1, c, a)` | 1 px line; c, a may be `(u) =>` with u 0 at start, 1 at end |
| `p.polyline(pts, c, a)` | lines through `[[x, y], ...]` |
| `p.beam(x0, y0, x1, y1, w, c, a)` | thick round-ended segment; c, a `(u along, v across 0..1)` |
| `p.circle(x, y, r, c, a)` | filled disc; c, a `(d 0 center..1 rim, angle)` |
| `p.ellipse(x, y, rx, ry, c, a)` | filled ellipse; c, a `(d, angle)` |
| `p.ring(x, y, r, w, c, a)` | ring from r - w to r; c, a `(v 0 inner..1 outer, angle)` |
| `p.arc(x, y, r, w, a0, a1, c, a)` | band of a ring from angle a0 to a1 (a1 > a0, radians, y down so +angle turns clockwise); `w` may be `(u) =>` to taper; c, a `(u along, v across)`. Slashes, smears, crescents |
| `p.rect(x, y, w, h, c, a)` | filled rectangle |
| `p.poly(pts, c, a)`, `p.tri(...)` | filled polygon |
| `p.shade(x0, y0, x1, y1, fn)` | pixel shader over a box: `fn(x, y, out)` returns a color, or sets `out.c`, `out.a`, `out.l` (light color), `out.k` (light amount). x and y are pixel centers (n.5): floor them for row or column tests like scanlines. Fields, swirls, flames, water |
| `p.glow(x, y, r, c, k)` | radial light, k at the center falling to 0 at r |
| `p.glowLine(x0, y0, x1, y1, r, c, k)` | light around a segment (beams) |
| `p.glowRing(x, y, R, r, c, k)` | light hugging a circle of radius R (shockwaves) |
| `p.light(x, y, c, k)` | light on one pixel |
| `p.sprite(rows, pal, x, y, {scale, a, flip, flipY, tint})` | tiny sprite from strings: `["..#..", ".#o#."]`, pal `{ "#": "#222034", o: C[4] }`, `.` is empty |
| `p.text(str, x, y, c, {font, scale, align, outline, shadow, a})` | pixel text: font `"mini"` (3x5) or `"big"` (5x7); c may be `(gx, gy) =>` for gradients |
| `p.measure(str, {font, scale})` | `[w, h]` of text |
| `p.mask(m, x, y, c, a)`, `p.outline(m, x, y, c, a)` | fill a mask, or the 1 px ring just outside it (actor silhouettes) |
| `p.get(x, y)` | the color already drawn under a point (0 if empty) |

## Helpers (`src/core/index.js`)

- **math**: `clamp lerp invLerp remap fract wrap TAU`, `seg(t, t0, t1)` (0..1 progress through a window: the
  basic timeline tool), `smooth(e0, e1, x)`, `bump(t, t0, t1)` (0, 1, 0), `pingpong`, `dist`, `angleTo`.
- **easing**: `ease.outCubic outQuart outExpo outBack(t, s) outElastic outBounce inQuad inCubic inExpo inOutSine ...`
- **random**: `rng(seed, i)` (a generator for particle i), `rand(seed, i, k)` (one number), `Rng` (`next range int
  chance sign pick gauss`).
- **noise**: `noise(x, seed)` 1D, `noise2(x, y, seed)`, `fbm(x, y, seed, octaves)`, all -1..1.
  For loops: `loopNoise(phase, radius, seed)` (same at phase 0 and 1); `tileNoise(x, y, px, py, seed)` and
  `tileFbm(...)` repeat every px / py cells, so scrolling by exactly `py` cells over a loop is seamless
  (`tileFbm(x * 0.3, y * 0.3 + phase * 8, 0, 8, seed)` rises forever without a seam).
- **particles**: `fly(x, y, vx, vy, t, g, drag)` → `[x, y]` (closed-form ballistic with drag), `flyV(...)` →
  velocity; `burst(n, seed, (r, i) => ...)` for one-shot sprays; `cycle(t, period, n, seed, life, (age, life,
  r, i) => ...)` for particles that loop seamlessly; `stream(t, t0, t1, rate, seed, life, fn)` for an emitter
  that runs then stops.
- **shapes**: `bolt(r, x0, y0, x1, y1, {jag, depth})` jagged lightning points, `forks(r, path, {...})` its
  branches, `star(cx, cy, r0, r1, n)`, `ngon(cx, cy, r, n)`, `trail(posFn, t, n, dt)`.
- **color**: `PAL` (hex ramps) and `RAMP` (the same as color numbers): fire ember lava smoke dust ice water
  electric volt poison holy heal arcane shadow blood earth stone gold leaf wood metal bone neon cyber matrix
  candy night. `ramp(hexList)`, `fit(palette, n)` (resample any palette to n steps, so `C[5]` always exists:
  use it on `o.palette` whenever you index steps by number), `at(ramp, t)` (pick a step, no blending), `blend(ramp, t)` (smooth, for
  light only), `mix`, `scale`, `hex`, `rgb`, `luma`, `WHITE`, `BLACK`, `INK`, `PATCH` (#f53cd1).
- **actor**: `stockActor()`, `drawActor(p)`, and the stock sprite itself as `HERO` (rows) and `HERO_PAL` (its colors).

## The bar

Effects here should look like a good pixel artist animated them. The checks:

1. **Pixel art, not vector art.** Hard pixels in the color buffer, fades by dither, softness only in the
   light buffer. No anti-aliased mush. Use `at()` steps, never `blend()` in the color buffer.
2. **Palette.** One ramp per element, 4 to 7 steps, hue-shifted (shadows cooler or deeper, highlights warmer
   or whiter). Hot cores go white or near-white; edges take the darkest step of the ramp, not black. Two or
   three elements per effect at most (e.g. fire + smoke + sparks).
3. **Reads at 1x.** A strong silhouette and one focal point. No speckle: no stray single pixels of noise inside
   shapes. Check the contact sheet at its smallest: can you tell what it is?
4. **Timing.** Fast in, slow out. Impacts get anticipation (optional), a 1 to 2 frame hero frame (white flash,
   biggest shape), follow-through, then a longer decay. Use `ease.outCubic/outQuart/outExpo` for things that
   burst and `inQuad` for things that fall or get sucked in. Hold the key pose a beat.
5. **Life.** Secondary motion under the main shape: sparks, motes, debris, smoke, drips. Vary every particle's
   size, speed, angle, life and delay (`r.range`). Nothing perfectly uniform or symmetric unless the style is.
6. **Light.** A big soft glow at low k plus a tight one at the hot spot, pulsing with the effect and dropping
   fast after an impact. Never so strong that it washes the pixels out.
7. **Fits its canvas** with a few pixels to spare; the checker reports spills. Choose the smallest canvas that
   holds the whole effect (common sizes 32 to 128 px).
8. **Ends clean or loops clean.** One-shots are empty at t = duration (fade by dither, shrink, fall away).
   Loops repeat with no seam (`cycle`, `loopNoise`, whole-cell `tileNoise` scrolls, `sin(phase * TAU * n)`).
9. **Original.** Generic motifs (coins, hearts, gems, skulls, stars, swords) are fine; never recreate a
   specific game's sprite, character or logo.
10. **Fast.** Under 2 ms a frame. Big `shade` boxes with heavy per-pixel math are the usual cost; keep boxes
    tight.

## The method

The method is Hugo Duprez's ([How to make (good) pixel art effects with
Claude](https://www.spritefusion.com/blog/how-to-make-good-pixel-art-effects-with-claude)): code is clay, trust
your eyes, feed your references.

1. **Say it in one line** with the art direction: what it is, how it moves, its palette, its timing. "A frost
   nova: crystals erupt in a ring from the feet outward, white flash at the center, shards spin off, the floor
   stays frosted and fades."
2. **Draft**, then **render**: `node tools/render.mjs <category>/<name>` writes
   `records/<category>/<name>/contact.png`. **Look at it** (open the PNG). `--all` shows every frame, `--gif`
   or `--mp4` writes an animation, `--opts '{"palette": [...]}'` tries options.
3. **Judge like a picky artist.** What reads first? Is there a hero frame? Is the timing punchy or floaty? Are
   the colors clean? Noise pixels, stiff motion, uniform particles, mushy dithering, too much glow?
4. **Fix the worst thing, render again.** Two to four rounds is normal. When unsure between directions, write
   3 to 5 variations side by side (`<name>-a.js`, `-b.js`...), render them all, keep the best, delete the rest.
5. **Check**: `node tools/check.mjs <category>/<name>` until it passes clean.
