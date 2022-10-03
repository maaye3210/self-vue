import { createRenderer } from '../runtime-core';

const isEventAttribute = name => /^on[A-Z]/.test(name)

function createElement(type) {
  return document.createElement(type)
}

function patchProps(el, key, prevVal, nextVal) {
  if (isEventAttribute(key)) {
    el.addEventListener(key.slice(2).toLowerCase(), nextVal)
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextVal)
    }
  }
}

function insert(el, container) {
  container.append(el)
}

const renderer: any = createRenderer({ createElement, patchProps, insert })

export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '../runtime-core'