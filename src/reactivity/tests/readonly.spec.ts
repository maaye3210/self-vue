import { readonly, isProxy } from '../reactive';

describe(
  "readonly",
  () => {
    it("happy path", () => {
      const obj = readonly({ foo: 1 })
      expect(obj.foo).toBe(1)
      obj.foo = 2
      expect(obj.foo).toBe(1)
      expect(isProxy(obj)).toBe(true)
    })
  }
)
