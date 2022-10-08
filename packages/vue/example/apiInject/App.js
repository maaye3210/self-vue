import { h, createTextVNode, getCurrentInstance, provide } from '../../dist/self-vue.esm.js';
import { Foo } from './Foo.js'
window.self = null
export const App = {
  setup() {
    provide('AppProvide', 'App Value')
  },
  render() {
    window.self = this
    return h('div', {
      id: 'root'
    },
      [
        h('p', { class: 'title' }, `Provide & Inject`),
        h(Foo, {})
      ])
  },
}