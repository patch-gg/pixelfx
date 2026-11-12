import { meta as boulder, create as createFall } from "../nature/boulder-fall.js";

export const meta = {
  ...boulder,
  name: "Ice block fall",
  desc: "A massive faceted ice block descends trailing snow, shatters into skidding crystal shards and cold mist, and spreads a bright frost ring across the floor.",
  tags: ["ice", "block", "fall", "spell", "impact", "shatter", "frost", "one-shot"],
  options: {
    palette: ["#111a37", "#1f325c", "#31598b", "#428bbb", "#65c6e2", "#a0e6f4", "#d7faff", "#ffffff"],
    seed: 17,
  },
};

export const create = o => createFall(o, "ice");
