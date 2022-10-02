import { track, trigger } from './effect';
import { Reactive_Flags, reactive, readonly } from './reactive';
import { isObject } from '../shared';


const creatGetter = (isReadonly = false, isShallow = false) => {
  return function get(target, key) {
    if (key === Reactive_Flags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === Reactive_Flags.IS_READONLY) {
      return isReadonly
    }
    const res = Reflect.get(target, key)

    if (isShallow) {
      return res
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    if (!isReadonly) {
      track(target, key)
    }

    return res
  }
}
const creatSetter = () => {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value)
    trigger(target, key)
    return res
  }
}

const readonlySetter = function (target, key) {
  console.warn(`${String(key)} set 失败，因为是只读类型`, target);
  return true
}

const get = creatGetter()
const set = creatSetter()
const readonlyGetter = creatGetter(true)
const shallowReadonly = creatGetter(true, true)

export const mutableHandlers = {
  get: get,
  set: set
}
export const readonlyHandlers = {
  get: readonlyGetter,
  set: readonlySetter
}

export const shallowReadonlyHandlers = {
  get: shallowReadonly,
  set: readonlySetter
}