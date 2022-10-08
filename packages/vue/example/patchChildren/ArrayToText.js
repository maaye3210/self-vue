import { ref, h } from '../../lib/self-vue.esm.js';

const prevChildren = [h('div', {}, 'A'), h('div', {}, 'B')]
const nextChildren = 'nextChildren'

export default {
  name: "A->T",
  setup() {
    const isChange = ref(false)
    window.isChange = isChange
    return {
      isChange
    }
  },
  render() {
    return this.isChange ? h('div', {}, prevChildren) : h('div', {}, nextChildren);
  },
};