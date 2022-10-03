import { h } from "../../lib/self-vue.esm.js";
// import PatchChildren from "./PatchChildren.js";
import ArrayToText from './ArrayToText.js';
import TextToText from './TextToText.js';

export default {
  name: "App",
  setup() { },

  render() {
    return h("div", {}, [h("p", {}, "主页"), h(ArrayToText)]);
  },
};
