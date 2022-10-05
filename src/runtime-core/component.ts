import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlot";
import { initProps } from './compontProps';
import { proxyRefs } from '../reactivity';

let currentInstance = null
let compiler;

export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => { },
    slots: {},
    next: null,
    provider: parent ? parent.provider : {},
    parent,
    subTree: {},
    isMounted: false
  }
  component.emit = emit.bind(null, component) as any
  return component
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props)
  setupStatefulComponent(instance)
  initSlots(instance, instance.vnode.children)
}

// 初始化组件的instance
function setupStatefulComponent(instance: any) {
  const Component = instance.type

  // ctx 上下文，用于代理用户数据和vue的api
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

  const { setup } = Component
  if (setup) {
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit })
    handleSetupResult(instance, setupResult)
    setCurrentInstance(null)
  }
}

// 根据不同的setup返回值做不同的处理，如果是对象则直接赋值给instance
function handleSetupResult(instance, setupResult: any) {
  if (typeof setupResult === 'object') {
    instance.setupState = proxyRefs(setupResult)
  }
  finishComponentSetup(instance)
}

// 最后将Component上的render放在instance上
function finishComponentSetup(instance) {
  const Component = instance.type


  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template);
    }
  }
  instance.render = Component.render

}

export function getCurrentInstance() {
  return currentInstance
}

function setCurrentInstance(instance) {
  currentInstance = instance
}

export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}
