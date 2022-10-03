import { h, ref, createTextVNode } from '../../lib/self-vue.esm.js';
window.self = null
export const App = {
  name: 'App',
  setup() {
    const count = ref(0)
    const onClick = () => {
      count.value++
      console.log(count.value);
    }
    const props = ref({
      foo: 'foo',
      bar: 'bar'
    })
    const onChangePropsDemo1 = () => {
      props.value.foo = 'new-foo'
    }
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined
    }
    const onChangePropsDemo3 = () => {
      props.value = {
        foo: 'foo',
      }
    }
    return {
      count,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      props
    }
  },
  render() {
    window.self = this
    return h('div', {
      id: 'root',
      class: 'head',
      foo: this.props.foo,
      bar: this.props.bar
    },
      [
        h('div', {}, [
          createTextVNode('count: '),
          h('span', { class: 'value' }, `${this.count}`)
        ]),
        h('div', {}, [
          createTextVNode('props.foo: '),
          h('span', { class: 'value' }, `${this.props.foo}`)
        ]),
        h('div', {}, [
          createTextVNode('props.bar: '),
          h('span', { class: 'value' }, `${this.props.bar}`)
        ]),
        h('button', { onClick: this.onClick }, '+1'),
        h('button', { onClick: this.onChangePropsDemo1 }, 'change'),
        h('button', { onClick: this.onChangePropsDemo2 }, 'undefined'),
        h('button', { onClick: this.onChangePropsDemo3 }, 'delete'),
      ])
  },
}