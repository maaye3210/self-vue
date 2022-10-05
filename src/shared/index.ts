export const extend = Object.assign

export const isObject = (target) => target !== null && typeof target === 'object'

export const hashChanged = (oldValue, newValue) => !Object.is(oldValue, newValue)

export const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

export const EMPTY_OBJ = {}

export const isString = (value) => typeof value === "string"
