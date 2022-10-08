import { computed } from "../src/computed"
import { reactive } from "../src/reactive"
import { vi } from 'vitest';

describe('computed', () => {
  it('happy path', () => {
    const value = reactive({
      foo: 1
    })
    const getter = vi.fn(() => {
      return value.foo
    })
    const cValue = computed(getter)
    expect(getter).not.toHaveBeenCalled()
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)
    // 依赖改变时不进行重新计算
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // 再次被获取时如果依赖改变则重新计算
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  })
})