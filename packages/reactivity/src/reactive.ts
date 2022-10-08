import { isObject } from '@self-vue/shared';
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers';

export enum Reactive_Flags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

export const reactive = (raw) => {
  return createActiveObject(raw, mutableHandlers)
}

export const readonly = (raw) => {
  return createActiveObject(raw, readonlyHandlers)
}

function createActiveObject(target, baseHandler) {
  if (!isObject(target)) {
    return console.warn(`target ${target} is not a object`)
  }
  return new Proxy(target, baseHandler)
}

export const isReactive = (target) => {
  return !!target[Reactive_Flags.IS_REACTIVE]
}

export const isReadonly = (target) => {
  return !!target[Reactive_Flags.IS_READONLY]
}

export const shallowReadonly = (taw) => {
  return createActiveObject(taw, shallowReadonlyHandlers)
}

export const isProxy = (target) => {
  return isReactive(target) || isReadonly(target)
}