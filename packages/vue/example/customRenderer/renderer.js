import { createRenderer } from "../../lib/self-vue.esm.js";

// 给基于 pixi.js 的渲染函数
const renderer = createRenderer({
  createElement(type) {
    const rect = new PIXI.Graphics();
    debugger
    rect.beginFill(0xff0000);
    rect.drawRect(0, 0, 100, 100);
    rect.endFill();

    return rect;
  },

  patchProps(el, key, value, nextValue) {
    el[key] = value;
  },

  insert(el, parent) {
    parent.addChild(el);
  },
});

export function createApp(rootComponent) {
  return renderer.createApp(rootComponent);
}
