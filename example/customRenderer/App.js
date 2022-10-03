import { h } from "../../lib/self-vue.esm.js";
import { game } from "./game.js";

export default {
  name: "App",
  setup() {

    return {
      x: 100,
      y: 100,
    };
  },

  render() {
    return h("rect", { x: this.x, y: this.y });
  },
};
