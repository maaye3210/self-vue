import { shallowReadonly, isReadonly } from '../src/reactive';

describe("shallowReadonly", () => {
  test("只有第一层是只读", () => {
    const props = shallowReadonly({ n: { foo: 1 } })
    expect(isReadonly(props)).toBe(true)
    expect(isReadonly(props.n)).toBe(false)
    // expect(isReactive(props.n)).toBe(true)
  })
})