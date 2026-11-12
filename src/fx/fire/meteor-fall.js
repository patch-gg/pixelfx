import { meta as boulder, create as createFall } from "../nature/boulder-fall.js";

export const meta = {
  ...boulder,
  name: "Meteor fall",
  desc: "A molten meteor falls with a streaming fire tail, bursts into glowing black rock and sparks, and leaves smouldering cracks and rising embers.",
  tags: ["fire", "meteor", "fall", "spell", "impact", "shatter", "embers", "one-shot"],
  options: {
    palette: ["#160e19", "#30202b", "#542c30", "#a13a27", "#ed6328", "#ffad38", "#ffde83", "#fff6d8"],
    seed: 17,
  },
};

export const create = o => createFall(o, "meteor");
