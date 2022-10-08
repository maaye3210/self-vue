import { h, createTextVNode, getCurrentInstance } from '../../lib/self-vue.esm.js';
import { Foo } from './Foo.js'
window.self = null
export const App = {
  setup() {
    console.log('getCurrentInstance', getCurrentInstance())
    return {
      name: 'hhh'
    }
  },
  render() {
    window.self = this
    return h('div', {
      id: 'root',
    },
      [
        h('span', {}, `hi, ${this.name}`),
        h(Foo, {})
      ])
  },
}