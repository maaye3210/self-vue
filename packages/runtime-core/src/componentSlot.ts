import { ShapeFlags } from "./ShapeFlags"

export function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots)
  }
}

function normalizeObjectSlots(children, slots) {
  Object.keys(children).map(key => {
    slots[key] = (props) => normalizeSlotValue(children[key](props))
  })
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value]
}
