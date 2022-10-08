import { effect } from '../src/effect';
import { ref, isRef, unRef, proxyRefs } from '../src/ref';

describe("ref", () => {
  it('happy path', () => {
    const foo = ref(1)
    expect(foo.value).toBe(1)
  })
  it('effect', () => {
    const a = ref(1)
    let dummy;
    let calls = 0
    effect(() => {
      calls++
      dummy = a.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
  })

  it("should make nested properties reactive", () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
    a.value.count = 3;
    expect(dummy).toBe(3);
  });

  it("isRef", () => {
    const testRef = ref({
      count: 1,
    });
    expect(isRef(testRef)).toBe(true)
    expect(isRef({})).toBe(false)
  });

  it("unRef", () => {
    const testRef = ref(1);
    expect(unRef(testRef)).toBe(1)
    expect(unRef(1)).toBe(1)
  });

  it("proxyRefs", () => {
    const testProxyRefs = proxyRefs({
      age: ref(10),
      name: 'Bob'
    })
    let text;
    effect(() => {
      text = `${testProxyRefs.name}${testProxyRefs.age}`
    })
    expect(testProxyRefs.age).toBe(10)
    expect(testProxyRefs.name).toBe('Bob')
    expect(text).toBe('Bob10')
    testProxyRefs.name = 'Marry'
    testProxyRefs.age = 20
    expect(testProxyRefs.name).toBe('Marry')
    expect(testProxyRefs.age).toBe(20)
    expect(text).toBe('Marry20')
  });
})