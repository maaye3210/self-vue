import { h, createTextVNode } from '../../dist/self-vue.esm.js';
import { Foo } from './Foo.js'
window.self = null
export const App = {
  setup() {
    return {
      name: 'may',
      count: 0,
    }
  },
  render() {
    window.self = this
    return h('div', {
      id: 'root',
      class: 'head',
    },
      [
        h('span', {}, `hi, ${this.name}`),
        h(Foo, {
          count: this.count,
          onAdd(num) {
            this.count += num
          }
        }, {
          header: ({ name }) => [h('p', {}, `header1 ${name}`), h('p', {}, `header2 ${name}`)],
          footer: () => h('p', {}, `footer`),
        })
      ])
  },
}