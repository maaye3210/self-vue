import { createComponentInstance, setupComponent } from './component';
import { ShapeFlags } from './ShapeFlags';
import { Fragment, Text } from './vnode';


export function render(vnode, container) {
  patch(vnode, container, null)
}

// 通过type区分是组件还是元素
function patch(vnode: any, container: any, parent) {
  if (!vnode) return
  const { type, shapeFlag } = vnode
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parent)
      break;
    case Text:
      processText(vnode, container, parent)
      break;

    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container, parent)
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container, parent)
      }
      break;
  }
}


function processFragment(vnode: any, container: any, parent) {
  mountChildren(vnode, container, parent)
}

function processText(vnode: any, container: any, parent) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}


// 组件的挂载流程
function processComponent(vnode: any, container: any, parent) {
  mountComponent(vnode, container, parent)
}

// 元素的挂载流程
function processElement(vnode: any, container: any, parent) {
  mountElement(vnode, container, parent)
}

// 根据元素的虚拟节点进行挂载，递归挂载子节点
function mountElement(vnode: any, container: any, parent) {
  const el = (vnode.el = document.createElement(vnode.type))
  const { children, props, shapeFlag } = vnode

  // 使用位运算判断虚拟节点类型
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountArrayChildren(children, el, parent)
  }

  for (const key in props) {
    const val = props[key]

    if (isEventAttribute(key)) {
      el.addEventListener(key.slice(2).toLowerCase(), val)
    } else {
      el.setAttribute(key, val)
    }

  }

  container.append(el)
}

const isEventAttribute = name => /^on[A-Z]/.test(name)


// 递归挂载子节点
function mountArrayChildren(children, container, parent) {
  children.forEach(v => {
    patch(v, container, parent)
  })
}

// 给组件创建instance实例，初始化组件
function mountComponent(initialVNode, container, parent) {
  const instance = createComponentInstance(initialVNode, parent)
  setupComponent(instance)
  setupRenderEffect(instance, initialVNode, container)
}

function mountChildren(vnode, container, parent) {
  vnode.children.forEach((v) => {
    patch(v, container, parent);
  });
}

// 
function setupRenderEffect(instance, initialVNode, container) {

  const { proxy } = instance
  // 将代理对象绑定给组件实例，这样就能直接通过this来访问了
  const subTree = instance.render.call(proxy)
  // debugger
  patch(subTree, container, instance)
  // 组件挂载完成后将根元素挂载到组件实例的虚拟节点上
  initialVNode.el = subTree.el
}

