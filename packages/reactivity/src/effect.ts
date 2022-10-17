import { extend } from '@self-vue/shared';

let activeEffect;
export const isTracking = () => !!activeEffect
const targetMap = new Map()

export class ReactiveEffect {
  private _fn: Function
  deps = []  // dep是一个Set数组，存储着依赖某个响应式对象某个属性的ReactiveEffect们，当这个ReactiveEffect对象被收集时，也会将这个Set添加进这个ReactiveEffect的deps数组，主要是方便删除依赖
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

// effect创建一个ReactiveEffect对象，返回它的run方法供外界调用
export function effect(fn: Function, option?) {
  const _effect = new ReactiveEffect(fn, option?.scheduler)
  extend(_effect, option)
  _effect.run()
  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

// 将响应式对象的target添加进targetMap，key添加到depMap，依赖的effect添加到dep（Set）
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

// targetMap 存储target对象和对应的depsMap，depsMap存储着某个属性的dep，dep是一个Set，存储着该属性的ReactiveEffect对象
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (!dep) return
  tiggerEffect(dep)
}

export function tiggerEffect(dep) {
  for (const effect of dep) {
    // 如果存在scheduler则调用scheduler，不存在则调用默认的run，在vue中会与返回的run方法共同用在异步渲染上
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