import { reactive, isReactive, isReadonly, readonly, isProxy } from '../reactive';

describe("reactive", () => {
  it("happy path", () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    expect(observed.foo).toBe(1)
    expect(isReactive(observed)).toBe(true)
    expect(isReadonly(original.foo)).toBe(false)
    expect(isProxy(observed)).toBe(true)
    expect(isProxy(original)).toBe(false)
  })
})

test("nested reactive", () => {
  const original = {
    nested: {
      foo: 0
    },
    arr: [1, {
      bar: 2
    }]
  }
  const observed = reactive(original)
  expect(isReactive(observed.nested)).toBe(true)
  expect(isReactive(observed.arr)).toBe(true)
  expect(isReactive(observed.arr[1])).toBe(true)
})