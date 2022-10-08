import { track, trigger } from './effect';
import { Reactive_Flags, reactive, readonly } from './reactive';
import { isObject } from '@self-vue/shared';


const creatGetter = (isReadonly = false, isShallow = false) => {
  return function get(target, key) {
    // 如果是isReactive或者isReadonly调用，则会查询这两个标志值，用闭包返回即可
    if (key === Reactive_Flags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === Reactive_Flags.IS_READONLY) {
      return isReadonly
    }
    const res = Reflect.get(target, key)

    // 如果是一个对象，则将这个对象也响应式化
    // ShallowReadonly第一层不需要响应式处理
    // TODO 如果返回的是一个对象。第一次需要新建它的响应式对象，第二次就应该直接返回这个响应式对象，而不是重新创建，因此，以下这种方法是不合理的
    if (!isShallow && isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    // readonly无需触发track
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

// readonly触发setter报错
const readonlySetter = function (target, key) {
  console.warn(`${String(key)} set 失败，因为是只读类型`, target);
  return true
}

const getter = creatGetter()
const setter = creatSetter()
const readonlyGetter = creatGetter(true)
const shallowReadonlyGetter = creatGetter(true, true)

export const mutableHandlers = {
  get: getter,
  set: setter
}
export const readonlyHandlers = {
  get: readonlyGetter,
  set: readonlySetter
}

export const shallowReadonlyHandlers = {
  get: shallowReadonlyGetter,
  set: readonlySetter
}