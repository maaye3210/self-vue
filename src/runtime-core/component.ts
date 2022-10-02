import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlot";
import { initProps } from './compontProps';

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => { },
    slots: {}
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
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit })
    handleSetupResult(instance, setupResult)
  }
}

// 根据不同的setup返回值做不同的处理，如果是对象则直接赋值给instance
function handleSetupResult(instance, setupResult: any) {
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

// 最后将Component上的render放在instance上
function finishComponentSetup(instance) {
  const Component = instance.type
  instance.render = Component.render
}

