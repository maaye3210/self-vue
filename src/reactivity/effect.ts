import { extend } from '../shared/index';

let activeEffect;
export const isTracking = () => !!activeEffect
const targetMap = new Map()

export class ReactiveEffect {
  private _fn: Function
  deps = []
  onStop?: () => void
  constructor(fn: Function, public scheduler?) {
    this._fn = fn
  }
  run() {
    activeEffect = this
    const res = this._fn()
    activeEffect = null
    return res
  }
  stop() {
    cleanupEffect(this)

    if (this.onStop) {
      this.onStop()
    }
  }
}

function cleanupEffect(effect: any) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect)
  })
  effect.deps.length = 0
}

export function effect(fn: Function, option?) {
  const _effect = new ReactiveEffect(fn, option?.scheduler)
  extend(_effect, option)
  _effect.run()
  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export function track(target, key) {
  if (!isTracking()) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }

  trackEffects(dep)
}

export function trackEffects(dep) {
  if (dep.has(activeEffect)) return
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (!dep) return
  tiggerEffect(dep)
}

export function tiggerEffect(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}

export function stop(runner) {
  runner.effect.stop()
}