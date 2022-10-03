import { h, renderSlots, getCurrentInstance, provide, inject, createTextVNode } from '../../lib/self-vue.esm.js';

const SubFoo = {
  setup(props) {
    const AppData = inject('AppProvide')
    const Default = inject('no', 'default')

    return {
      name: 'SubFoo',
      AppData,
      Default,
    }
  },
  render() {
    return h('div', { class: 'subfoo' }, [createTextVNode('SubFoo : '), h('span', { class: 'value' }, `${this.AppData} ${this.Default}`)])
  },
}

export const Foo = {
  setup(props) {
    const AppData = inject('AppProvide')
    provide('AppProvide', 'Foo Value')
    return {
      name: 'Foo',
      AppData
    }
  },
  render() {
    const div = h('div', { class: 'foo' }, [createTextVNode('FOO : '), h('span', { class: 'value' }, `${this.AppData} `)])
    // debugger
    return h('div', {}, [div, h(SubFoo)])
  },
}