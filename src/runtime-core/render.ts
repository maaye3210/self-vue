import { effect } from '../reactivity/effect';
import { createComponentInstance, setupComponent } from './component';
import { createAppAPI } from './creatApp';
import { ShapeFlags } from './ShapeFlags';
import { Fragment, Text } from './vnode';
import { EMPTY_OBJ } from '../shared';

export function createRenderer(option) {
  const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = option

  function render(vnode, container) {
    patch(null, vnode, container, null, null)
  }

  // 通过type区分是组件还是元素
  function patch(n1, n2, container, parent, anchor) {
    if (!n2) return
    const { type, shapeFlag } = n2
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parent, anchor)
        break;
      case Text:
        processText(n1, n2, container, parent)
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parent, anchor)
        }
        break;
    }
  }


  function processFragment(n1, n2: any, container: any, parent, anchor) {
    mountArrayChildren(n2.children, container, parent, anchor)
  }

  function processText(n1, n2: any, container: any, parent) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }


  // 组件的挂载流程
  function processComponent(n1, n2: any, container: any, parent, anchor) {
    mountComponent(n2, container, parent, anchor)
  }

  // 元素的挂载流程
  function processElement(n1, n2: any, container: any, parent, anchor) {
    if (!n1) {
      mountElement(n2, container, parent, anchor)
    } else {
      patchElement(n1, n2, container, parent, anchor)
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log('patchElement');
    console.log('n1', n1);
    console.log('n2', n2);

    const el = (n2.el = n1.el)

    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    // debugger
    patchChildren(n1, n2, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag: nextShapeFlag } = n2
    const { shapeFlag: prevShapeFlag } = n1
    const children1 = n1.children
    const children2 = n2.children
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(children1)
      }
      if (children1 !== children2) {
        hostSetElementText(container, children2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountArrayChildren(children2, container, parentComponent, anchor)
      } else {
        // array diff array
        patchKeyedChildren(children1, children2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const l2 = c2.length;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    function isSomeVNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }

    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      i++;
    }

    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      e1--;
      e2--;
    }

    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      hostRemove(el)
    }
  }

  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const newProp = newProps[key]
        if (prevProp !== newProp) {
          hostPatchProps(el, key, prevProp, newProp)
        }
      }

      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProps(el, key, oldProps[key], null)
          }
        }
      }

    }
  }

  // 根据元素的虚拟节点进行挂载，递归挂载子节点
  function mountElement(initialVNode: any, container: any, parent, anchor) {
    // debugger
    const el = (initialVNode.el = hostCreateElement(initialVNode.type))
    const { children, props, shapeFlag } = initialVNode

    // 使用位运算判断虚拟节点类型
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountArrayChildren(children, el, parent, anchor)
    }

    for (const key in props) {
      const val = props[key]

      hostPatchProps(el, key, null, val)
    }

    hostInsert(el, container)
  }

  // 递归挂载子节点
  function mountArrayChildren(children, container, parent, anchor) {
    children.forEach(v => {
      patch(null, v, container, parent, anchor)
    })
  }

  // 给组件创建instance实例，初始化组件
  function mountComponent(initialVNode, container, parent, anchor) {
    const instance = createComponentInstance(initialVNode, parent)
    setupComponent(instance)
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  // 
  function setupRenderEffect(instance, initialVNode, container, anchor) {

    effect(
      () => {
        if (!instance.isMounted) {
          const { proxy } = instance
          // 将代理对象绑定给组件实例，这样就能直接通过this来访问了
          const subTree = (instance.subTree = instance.render.call(proxy))
          patch(null, subTree, container, instance, anchor)
          // 组件挂载完成后将根元素挂载到组件实例的虚拟节点上
          initialVNode.el = subTree.el
          instance.isMounted = true
        } else {
          console.log('update');
          const { proxy } = instance
          // 将代理对象绑定给组件实例，这样就能直接通过this来访问了
          const subTree = instance.render.call(proxy)
          const preSubTree = instance.subTree
          patch(preSubTree, subTree, container, instance, anchor)
        }
      }
    )
  }

  return {
    createApp: createAppAPI(render)
  }

}

