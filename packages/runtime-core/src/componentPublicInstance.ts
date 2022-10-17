import { hasOwn } from "@self-vue/shared"

const publicPropertiesMap = {
  $el: instance => instance.vnode.el,
  $slots: instance => instance.slots,
  $props: instance => instance.props
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance

    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    }

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  }
}

