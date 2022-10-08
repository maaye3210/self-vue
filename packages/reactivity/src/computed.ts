import { ReactiveEffect } from "./effect"


class ComputedRefImpl {
  private _dirty = true  // 用于标识依赖数据是否发生改变
  private _value: any
  private _effect: ReactiveEffect
  constructor(getter) {
    this._effect = new ReactiveEffect(getter, () => {
      this._dirty = true
    })
  }

  public get value() {
    // 用于标识依赖数据发生改变时，再次触发getter才会重新计算。与实时计算不同
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }

}

export const computed = (fn) => {
  return new ComputedRefImpl(fn)
}