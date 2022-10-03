'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN";
})(ShapeFlags || (ShapeFlags = {}));

const Fragment = Symbol("Fragment");
const Text = Symbol("Fragment");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlag: getShapeFlag(type, children)
    };
    return vnode;
}
function getShapeFlag(type, children) {
    let flag = typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
    if (typeof children === 'string') {
        flag |= ShapeFlags.TEXT_CHILDREN;
    }
    else if (Array.isArray(children)) {
        flag |= ShapeFlags.ARRAY_CHILDREN;
    }
    if (flag & ShapeFlags.STATEFUL_COMPONENT && typeof children === 'object') {
        flag |= ShapeFlags.SLOT_CHILDREN;
    }
    return flag;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

const isObject = (target) => target !== null && typeof target === 'object';
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const targetMap = new Map();
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    const dep = depsMap.get(key);
    if (!dep)
        return;
    tiggerEffect(dep);
}
function tiggerEffect(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

const creatGetter = (isReadonly = false, isShallow = false) => {
    return function get(target, key) {
        if (key === Reactive_Flags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === Reactive_Flags.IS_READONLY) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (isShallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
};
const creatSetter = () => {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
};
const readonlySetter = function (target, key) {
    console.warn(`${String(key)} set 失败，因为是只读类型`, target);
    return true;
};
const get = creatGetter();
const set = creatSetter();
const readonlyGetter = creatGetter(true);
const shallowReadonly$1 = creatGetter(true, true);
const mutableHandlers = {
    get: get,
    set: set
};
const readonlyHandlers = {
    get: readonlyGetter,
    set: readonlySetter
};
const shallowReadonlyHandlers = {
    get: shallowReadonly$1,
    set: readonlySetter
};

var Reactive_Flags;
(function (Reactive_Flags) {
    Reactive_Flags["IS_REACTIVE"] = "__v_isReactive";
    Reactive_Flags["IS_READONLY"] = "__v_isReadonly";
})(Reactive_Flags || (Reactive_Flags = {}));
const reactive = (raw) => {
    return createActiveObject(raw, mutableHandlers);
};
const readonly = (raw) => {
    return createActiveObject(raw, readonlyHandlers);
};
function createActiveObject(target, baseHandler) {
    if (!isObject(target)) {
        return console.warn(`target ${target} is not a object`);
    }
    return new Proxy(target, baseHandler);
}
const shallowReadonly = (taw) => {
    return createActiveObject(taw, shallowReadonlyHandlers);
};

function emit(instance, event, ...args) {
    console.log(event);
    const { props } = instance;
    const handler = props['on' + capitalize(event)];
    handler && handler(...args);
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const publicPropertiesMap = {
    $el: instance => instance.vnode.el,
    $slots: instance => instance.slots
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    Object.keys(children).map(key => {
        slots[key] = (props) => normalizeSlotValue(children[key](props));
    });
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
        provider: parent ? parent.provider : {},
        parent
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    setupStatefulComponent(instance);
    initSlots(instance, instance.vnode.children);
}
// 初始化组件的instance
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // ctx 上下文，用于代理用户数据和vue的api
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        handleSetupResult(instance, setupResult);
        setCurrentInstance(null);
    }
}
// 根据不同的setup返回值做不同的处理，如果是对象则直接赋值给instance
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
// 最后将Component上的render放在instance上
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function render(vnode, container) {
    patch(vnode, container, null);
}
// 通过type区分是组件还是元素
function patch(vnode, container, parent) {
    if (!vnode)
        return;
    const { type, shapeFlag } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                processElement(vnode, container, parent);
            }
            else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                processComponent(vnode, container, parent);
            }
            break;
    }
}
function processFragment(vnode, container, parent) {
    mountChildren(vnode, container, parent);
}
function processText(vnode, container, parent) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
// 组件的挂载流程
function processComponent(vnode, container, parent) {
    mountComponent(vnode, container, parent);
}
// 元素的挂载流程
function processElement(vnode, container, parent) {
    mountElement(vnode, container, parent);
}
// 根据元素的虚拟节点进行挂载，递归挂载子节点
function mountElement(vnode, container, parent) {
    const el = (vnode.el = document.createElement(vnode.type));
    const { children, props, shapeFlag } = vnode;
    // 使用位运算判断虚拟节点类型
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
    }
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountArrayChildren(children, el, parent);
    }
    for (const key in props) {
        const val = props[key];
        if (isEventAttribute(key)) {
            el.addEventListener(key.slice(2).toLowerCase(), val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
const isEventAttribute = name => /^on[A-Z]/.test(name);
// 递归挂载子节点
function mountArrayChildren(children, container, parent) {
    children.forEach(v => {
        patch(v, container, parent);
    });
}
// 给组件创建instance实例，初始化组件
function mountComponent(initialVNode, container, parent) {
    const instance = createComponentInstance(initialVNode, parent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function mountChildren(vnode, container, parent) {
    vnode.children.forEach((v) => {
        patch(v, container, parent);
    });
}
// 
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    // 将代理对象绑定给组件实例，这样就能直接通过this来访问了
    const subTree = instance.render.call(proxy);
    // debugger
    patch(subTree, container, instance);
    // 组件挂载完成后将根元素挂载到组件实例的虚拟节点上
    initialVNode.el = subTree.el;
}

const createApp = (rootComponent) => {
    return {
        mount(rootContainer) {
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
};

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function provide(name, value) {
    var _a;
    const curentInstance = getCurrentInstance();
    if (curentInstance) {
        let { provider } = curentInstance;
        const parentProvider = (_a = curentInstance.parent) === null || _a === void 0 ? void 0 : _a.provider;
        if (provider === parentProvider) {
            provider = curentInstance.provider = Object.create(parentProvider);
        }
    }
    curentInstance && (curentInstance.provider[name] = value);
}
function inject(name, defaultValue) {
    const curentInstance = getCurrentInstance();
    // debugger
    const parentInstance = curentInstance.parent;
    return parentInstance.provider[name] || defaultValue;
}

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.renderSlots = renderSlots;
