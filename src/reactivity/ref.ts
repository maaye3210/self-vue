import { isTracking, tiggerEffect, trackEffects } from './effect';
import { reactive } from './reactive';
import { hashChanged, isObject } from '../shared';

class RefImpl {
  private _value;
  private deps;
  private _rawValue;
  public __v_isRef = true;
  constructor(value) {
    this._value = canvert(value)
    this._rawValue = value
    this.deps = new Set()
  }

  public get value() {
    trackRefValue(this)
    return this._value
  }

  public set value(newValue) {
    if (!hashChanged(this._rawValue, newValue)) return
    this._rawValue = newValue;
    this._value = canvert(newValue)
    tiggerEffect(this.deps)
  }
}

function canvert(value) {
  return isObject(value) ? reactive(value) : value;
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.deps)
  }
}

export const ref = (value) => {
  return new RefImpl(value)
}

export const isRef = (value) => {
  return !!value.__v_isRef
}

export const unRef = (ref) => {
  return ref.__v_isRef ? ref.value : ref
}

export const proxyRefs = (objectWithRef) => {
  return new Proxy(objectWithRef, {
    get: (target, key) => {
      return unRef(target[key])
    },
    set: (target, key, value) => {
      if (isRef(target[key]) && !isRef(value)) {
        return target[key].value = value
      }
      return Reflect.set(target, key, value)
    }
  })
}