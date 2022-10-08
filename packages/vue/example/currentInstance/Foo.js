import { h, renderSlots, getCurrentInstance } from '../../lib/self-vue.esm.js';

export const Foo = {
  setup(props) {
    console.log(props);
    console.log(getCurrentInstance());
    return {
      name: '小马'
    }
  },
  render() {
    const div = h('div', { class: 'foo' }, `FOO`)
    console.log(this.$slots);
    return h('div', {}, [renderSlots(this.$slots, 'header', this), div, renderSlots(this.$slots, 'footer', this)])
  },
}