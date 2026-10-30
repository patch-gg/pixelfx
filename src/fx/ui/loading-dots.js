import { PAL, clamp } from "../../core/index.js";
import { fit } from "./_lib.js";

export const meta = {
  name: "Loading dots",
  desc: "Three round dots hop one after another: stretched as they leap and fall, round at the top, squashed flat for a beat as they land.",
  tags: ["ui", "loading", "dots", "wait", "typing", "loop"],
  size: [48, 28],
  origin: [24, 20],
  duration: 1.1,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.metal, count: 3, gap: 12, seed: 10 },
};

// hand-drawn poses: k outline, w highlight, h lit, s shade
const ROUND = ["..kkkk..", ".khhhhk.", "khwhhhhk", "khhhhhhk", "khhhhhsk", "khhhhssk", ".kshssk.", "..kkkk.."];
const TALL = ["..kkk..", ".khhhk.", "khwhhhk", "khhhhhk", "khhhhhk", "khhhhsk", "khhhssk", ".khssk.", "..kkk.."];
const FLAT = ["..kkkkkk..", ".khwhhhhk.", "khhhhhhhsk", "khhhhhhssk", ".kshhhssk.", "..kkkkkk.."];

export function draw(p, t, o) {
  const C = fit(o.palette), ph = t / meta.duration, n = o.count;
  const pal = { k: C[1], w: C[7], h: C[6], s: C[4] };
  for (let i = 0; i < n; i++) {
    const x = Math.round((i - (n - 1) / 2) * o.gap);
    // each dot hops in its own slice of the loop; the rest of the time it sits
    const k = clamp((((ph - i * 0.14) % 1) + 1) % 1 / 0.36);
    const air = k > 0 && k < 1, h = air ? Math.round(Math.sin(k * Math.PI) * 8) : 0;
    const fast = air && Math.abs(Math.cos(k * Math.PI)) > 0.45, land = (((ph - i * 0.14 - 0.36) % 1) + 1) % 1 < 0.06;
    const pose = land ? FLAT : fast ? TALL : ROUND;
    const w = pose[0].length, hh = pose.length;
    // a shadow on the floor, shrinking as the dot rises
    const sw = Math.max(1, 4 - Math.floor(h / 3));
    p.rect(x - sw, 0, sw * 2, 1, C[1]);
    p.sprite(pose, pal, x - Math.floor(w / 2), -hh - h + 1);
    if (air) p.light(x, -h - 3, C[6], 0.2);
  }
}
