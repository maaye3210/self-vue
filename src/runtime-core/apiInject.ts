import { getCurrentInstance } from './component';

export function provide(name, value) {
  const curentInstance: any = getCurrentInstance()

  if (curentInstance) {
    let { provider } = curentInstance
    const parentProvider = curentInstance.parent?.provider
    if (provider === parentProvider) {
      provider = curentInstance.provider = Object.create(parentProvider)
    }
  }

  curentInstance && (curentInstance.provider[name] = value)
}

export function inject(name, defaultValue) {
  const curentInstance: any = getCurrentInstance()
  // debugger
  const parentInstance = curentInstance.parent

  return parentInstance.provider[name] || defaultValue
}