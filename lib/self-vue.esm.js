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

const extend = Object.assign;
const isObject = (target) => target !== null && typeof target === 'object';
const hashChanged = (oldValue, newValue) => !Object.is(oldValue, newValue);
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const EMPTY_OBJ = {};

let activeEffect;
const isTracking = () => !!activeEffect;
const targetMap = new Map();
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this._fn = fn;
    }
    run() {
        activeEffect = this;
        const res = this._fn();
        activeEffect = null;
        return res;
    }
    stop() {
        cleanupEffect(this);
        if (this.onStop) {
            this.onStop();
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function effect(fn, option) {
    const _effect = new ReactiveEffect(fn, option === null || option === void 0 ? void 0 : option.scheduler);
    extend(_effect, option);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
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
        if (!isReadonly) {
            track(target, key);
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

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._value = canvert(value);
        this._rawValue = value;
        this.deps = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (!hashChanged(this._rawValue, newValue))
            return;
        this._rawValue = newValue;
        this._value = canvert(newValue);
        tiggerEffect(this.deps);
    }
}
function canvert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.deps);
    }
}
const ref = (value) => {
    return new RefImpl(value);
};
const isRef = (value) => {
    return !!value.__v_isRef;
};
const unRef = (ref) => {
    return ref.__v_isRef ? ref.value : ref;
};
const proxyRefs = (objectWithRef) => {
    return new Proxy(objectWithRef, {
        get: (target, key) => {
            return unRef(target[key]);
        },
        set: (target, key, value) => {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            return Reflect.set(target, key, value);
        }
    });
};

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
        parent,
        subTree: {},
        isMounted: false
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
        instance.setupState = proxyRefs(setupResult);
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

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
}

function createRenderer(option) {
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert } = option;
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    // 通过type区分是组件还是元素
    function patch(n1, n2, container, parent) {
        if (!n2)
            return;
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parent);
                }
                else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parent) {
        mountChildren(n2, container, parent);
    }
    function processText(n1, n2, container, parent) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    // 组件的挂载流程
    function processComponent(n1, n2, container, parent) {
        mountComponent(n2, container, parent);
    }
    // 元素的挂载流程
    function processElement(n1, n2, container, parent) {
        if (!n1) {
            mountElement(n2, container, parent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    function patchElement(n1, n2, container) {
        console.log('patchElement');
        console.log('n1', n1);
        console.log('n2', n2);
        const el = (n2.el = n1.el);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // debugger
        patchProps(el, oldProps, newProps);
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const newProp = newProps[key];
                if (prevProp !== newProp) {
                    hostPatchProps(el, key, prevProp, newProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProps(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    // 根据元素的虚拟节点进行挂载，递归挂载子节点
    function mountElement(initialVNode, container, parent) {
        // debugger
        const el = (initialVNode.el = hostCreateElement(initialVNode.type));
        const { children, props, shapeFlag } = initialVNode;
        // 使用位运算判断虚拟节点类型
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children;
        }
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountArrayChildren(children, el, parent);
        }
        for (const key in props) {
            const val = props[key];
            hostPatchProps(el, key, null, val);
        }
        hostInsert(el, container);
    }
    // 递归挂载子节点
    function mountArrayChildren(children, container, parent) {
        children.forEach(v => {
            patch(null, v, container, parent);
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
            patch(null, v, container, parent);
        });
    }
    // 
    function setupRenderEffect(instance, initialVNode, container) {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                // 将代理对象绑定给组件实例，这样就能直接通过this来访问了
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance);
                // 组件挂载完成后将根元素挂载到组件实例的虚拟节点上
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('update');
                const { proxy } = instance;
                // 将代理对象绑定给组件实例，这样就能直接通过this来访问了
                const subTree = instance.render.call(proxy);
                const preSubTree = instance.subTree;
                patch(preSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}

const isEventAttribute = name => /^on[A-Z]/.test(name);
function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, prevVal, nextVal) {
    if (isEventAttribute(key)) {
        el.addEventListener(key.slice(2).toLowerCase(), nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, container) {
    container.append(el);
}
const renderer = createRenderer({ createElement, patchProps, insert });
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
