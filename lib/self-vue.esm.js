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
        key: props && props.key,
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
    $slots: instance => instance.slots,
    $props: instance => instance.props
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
        next: null,
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

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    debugger;
    let job;
    while (job = queue.shift()) {
        job && job();
    }
}

function createRenderer(option) {
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = option;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    // 通过type区分是组件还是元素
    function patch(n1, n2, container, parent, anchor) {
        if (!n2)
            return;
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parent, anchor);
                }
                else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parent, anchor) {
        mountArrayChildren(n2.children, container, parent, anchor);
    }
    function processText(n1, n2, container, parent, anchor) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    // 组件的挂载流程
    function processComponent(n1, n2, container, parent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    // 区分元素的挂载与更新流程
    function processElement(n1, n2, container, parent, anchor) {
        if (!n1) {
            mountElement(n2, container, parent, anchor);
        }
        else {
            updateElement(n1, n2, container, parent, anchor);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function updateElement(n1, n2, container, parentComponent, anchor) {
        console.log('updateElement');
        console.log('old-vnode', n1);
        console.log('new-vnode', n2);
        const el = (n2.el = n1.el);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // debugger
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: nextShapeFlag } = n2;
        const { shapeFlag: prevShapeFlag } = n1;
        const children1 = n1.children;
        const children2 = n2.children;
        if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(children1);
            }
            if (children1 !== children2) {
                hostSetElementText(container, children2);
            }
        }
        else {
            if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, '');
                mountArrayChildren(children2, container, parentComponent, anchor);
            }
            else {
                // array diff array
                patchKeyedChildren(children1, children2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
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
            }
            else {
                break;
            }
            i++;
        }
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
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
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
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
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
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
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
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
    function mountElement(initialVNode, container, parent, anchor) {
        console.log('mountElement', initialVNode);
        const el = (initialVNode.el = hostCreateElement(initialVNode.type));
        const { children, props, shapeFlag } = initialVNode;
        // 使用位运算判断虚拟节点类型
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children;
        }
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountArrayChildren(children, el, parent, anchor);
        }
        for (const key in props) {
            const val = props[key];
            hostPatchProps(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    // 递归挂载子节点
    function mountArrayChildren(children, container, parent, anchor) {
        children.forEach(v => {
            patch(null, v, container, parent, anchor);
        });
    }
    // 给组件创建instance实例，初始化组件
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
    }
    // 
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log('mountComponent', instance);
                const { proxy } = instance;
                // 将代理对象绑定给组件实例，这样就能直接通过this来访问了
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance, anchor);
                // 组件挂载完成后将根元素挂载到组件实例的虚拟节点上
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('updateComponent', instance);
                const { next, vnode, proxy } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy);
                const preSubTree = instance.subTree;
                patch(preSubTree, subTree, container, instance, anchor);
                instance.subTree = subTree;
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            },
        });
    }
    return {
        createApp: createAppAPI(render)
    };
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
                }
                else {
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
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function remove(el) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({ createElement, patchProps, insert, remove, setElementText });
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, renderSlots };
