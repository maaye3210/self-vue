import { effect } from '@self-vue/reactivity';
import { createComponentInstance, setupComponent } from './component';
import { createAppAPI } from './creatApp';
import { ShapeFlags } from './ShapeFlags';
import { Fragment, Text } from './vnode';
import { EMPTY_OBJ } from '@self-vue/shared';
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { queueJobs } from './scheduler';

export function createRenderer(option) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = option

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
        processText(n1, n2, container, parent, anchor)
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

  function processFragment(n1, n2, container, parent, anchor) {
    if (!n1) {
      mountArrayChildren(n2.children, container, parent, anchor)
    } else {
      updateArrayChildren(n1, n2, container, parent, anchor)
    }
  }

  // 递归挂载子节点
  function mountArrayChildren(children, container, parent, anchor) {
    children.forEach(v => {
      patch(null, v, container, parent, anchor)
    })
  }

  function updateArrayChildren(n1, n2, container, parent, anchor) {
    console.log('update fragment');
    patchKeyedChildren(n1, n2, container, parent, anchor)
  }

  function processText(n1, n2, container, parent, anchor) {
    if (!n1) {
      mountTextChildren(n2, container)
    } else {
      updateTextChildren(n1, n2)
    }
  }

  function mountTextChildren(n2, container) {
    const { children: newText } = n2;
    console.log('mount text', newText);
    const textNode = (n2.el = document.createTextNode(newText));
    container.append(textNode);
  }

  function updateTextChildren(n1, n2) {
    const { children: newText } = n2;
    const { children: oldText } = n1;
    const el = (n2.el = n1.el)
    if (newText !== oldText) {
      console.log('update text', oldText, '->', newText);
      el.data = newText
    }
  }

  // 组件的挂载流程
  function processComponent(n1, n2, container, parent, anchor) {
    if (!n1) {
      mountComponent(n2, container, parent, anchor)
    } else {
      updateComponent(n1, n2)
    }

  }

  // 给组件创建instance实例，初始化组件
  function mountComponent(initialVNode, container, parentComponent, anchor) {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));
    setupComponent(instance)
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  // 区分元素的挂载与更新流程
  function processElement(n1, n2, container, parent, anchor) {
    if (!n1) {
      mountElement(n2, container, parent, anchor)
    } else {
      updateElement(n1, n2, container, parent, anchor)
    }
  }

  // 根据元素的虚拟节点进行挂载，递归挂载子节点
  function mountElement(initialVNode, container, parent, anchor) {
    console.log('mount element', initialVNode);
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

    hostInsert(el, container, anchor)
    console.log('element mounted', initialVNode);

  }

  function updateElement(n1, n2, container, parentComponent, anchor) {
    console.log('update element of', container, 'old-vnode', n1, 'new-vnode', n2);
    const el = (n2.el = n1.el)
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    patchChildren(n1, n2, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag: nextShapeFlag } = n2
    const { shapeFlag: prevShapeFlag } = n1
    const oldChildren = n1.children
    const newChildren = n2.children
    console.log('conpare children of', container, 'oldChildren:', oldChildren, ' newChildren:', newChildren);
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(oldChildren)
      }
      if (oldChildren !== newChildren) {
        hostSetElementText(container, newChildren)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountArrayChildren(newChildren, container, parentComponent, anchor)
      } else {
        patchKeyedChildren(oldChildren, newChildren, container, parentComponent, anchor);
      }
    }
  }

  function patchProps(el, oldProps, newProps) {
    console.log('compare props: ', 'oldProps', oldProps, 'newProps', newProps);
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

  // 当新旧子元素都是Array类型的时候，使用diff算法进行更新
  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    console.log('diff......');
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
      // 中间对比
      let s1 = i;
      let s2 = i;

      const toBePatched = e2 - s2 + 1;
      let patched = 0;
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched);
      let moved = false;
      let maxNewIndexSoFar = 0;
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSomeVNodeType(prevChild, c2[j])) {
              newIndex = j;

              break;
            }
          }
        }

        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;

      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function unmountChildren(children) {
    console.log('unmount all children');
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      hostRemove(el)
    }
  }




  function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
  }

  function setupRenderEffect(instance, initialVNode, container, anchor) {
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          console.log('beforeMountComponent ', instance.type.name, instance);
          mountRenderEffect(instance, initialVNode, container, anchor)
          console.log('mountedComponent ', instance.type.name, instance);
        } else {
          console.log('beforeUpdateComponent ', instance.type.name, instance);
          updateRenderEffect(instance, container, anchor)
          console.log('updatedComponent ', instance.type.name, instance);
        }
      },
      {
        scheduler() {
          queueJobs(instance.update);
        },
      }
    )
  }

  function mountRenderEffect(instance, initialVNode, container, anchor) {
    console.log('mountComponent', instance);
    const { proxy } = instance
    // 将代理对象绑定给组件实例，这样就能直接通过this来访问了
    const subTree = (instance.subTree = instance.render.call(proxy, proxy))
    patch(null, subTree, container, instance, anchor)
    // 组件挂载完成后将根元素挂载到组件实例的虚拟节点上
    initialVNode.el = subTree.el
    instance.isMounted = true
  }

  function updateRenderEffect(instance, container, anchor) {
    console.log('updateComponent', instance);
    const { next, vnode, proxy } = instance;
    if (next) {
      next.el = vnode.el;
      updateComponentPreRender(instance, next);
    }
    const subTree = instance.render.call(proxy, proxy)
    const preSubTree = instance.subTree
    instance.subTree = subTree
    patch(preSubTree, subTree, container, instance, anchor)
  }

  return {
    createApp: createAppAPI(render)
  }

}

function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
