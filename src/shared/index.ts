export const extend = Object.assign

export const isObject = (target) => target !== null && typeof target === 'object'

export const hashChanged = (oldValue, newValue) => !Object.is(oldValue, newValue)
