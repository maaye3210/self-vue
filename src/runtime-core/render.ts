import { createComponentInstance, setupComponent } from './component';
import { ShapeFlags } from './ShapeFlags';
import { Fragment, Text } from './vnode';


export function render(vnode, container) {
  patch(vnode, container)
}

// 通过type区分是组件还是元素
function patch(vnode: any, container: any) {
  const { type, shapeFlag } = vnode
  switch (type) {
    case Fragment:
      processFragment(vnode, container)
      break;
    case Text:
      processText(vnode, container)
      break;

    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container)
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
      }
      break;
  }
}


function processFragment(vnode: any, container: any) {
  mountChildren(vnode, container)
}

function processText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}


// 组件的挂载流程
function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

// 元素的挂载流程
function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}

// 根据元素的虚拟节点进行挂载，递归挂载子节点
function mountElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type))
  const { children, props, shapeFlag } = vnode

  // 使用位运算判断虚拟节点类型
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountArrayChildren(children, el)
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
function mountArrayChildren(children, container) {
  children.forEach(v => {
    patch(v, container)
  })
}

// 给组件创建instance实例，初始化组件
function mountComponent(initialVNode, container) {
  const instance = createComponentInstance(initialVNode)
  setupComponent(instance)
  setupRenderEffect(instance, initialVNode, container)
}

function mountChildren(vnode, container) {
  vnode.children.forEach((v) => {
    patch(v, container);
  });
}

// 
function setupRenderEffect(instance, initialVNode, container) {

  const { proxy } = instance
  // 将代理对象绑定给组件实例，这样就能直接通过this来访问了
  const subTree = instance.render.call(proxy)
  // debugger
  patch(subTree, container)
  // 组件挂载完成后将根元素挂载到组件实例的虚拟节点上
  initialVNode.el = subTree.el
}

