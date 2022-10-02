import { h, renderSlots } from '../../lib/self-vue.esm.js';

export const Foo = {
  setup(props, { emit }) {
    props.count++
    console.log(props);
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