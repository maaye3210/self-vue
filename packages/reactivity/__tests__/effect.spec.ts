import { effect, stop } from '../src/effect';
import { reactive } from '../src/reactive';
import { vi } from 'vitest';
describe("effect", () => {
  it("happy", () => {
    const user = reactive({
      age: 10
    })
    let nextAge;
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)
    user.age++
    console.log(nextAge);

    expect(nextAge).toBe(12)
  })
  it("return runner", () => {
    let foo = 1
    const runner = effect(() => {
      foo++
      return 'foo'
    })
    expect(foo).toBe(2)
    const res = runner()
    expect(foo).toBe(3)
  })
  it("scheduler", () => {
    let dummy;
    let run;
    const obj = reactive({ foo: 1 })
    const scheduler = vi.fn(() => {
      run = runner
    })
    const runner = effect(() => {
      dummy = obj.foo
    },
      { scheduler }
    )
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)
    run()
    expect(dummy).toBe(2)
  })
  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    stop(runner)
    obj.prop++
    expect(dummy).toBe(2)
  })
  it("onStop", () => {
    const obj = reactive({ foo: 1 })
    const onStop = vi.fn()
    let dummy;
    const runner = effect(() => {
      dummy = obj.foo
    },
      {
        onStop
      }
    )
    stop(runner)
    expect(onStop).toBeCalledTimes(1)
  })
})

// test("nested reactive", () => {
//   const original = {
//     nested: {
//       foo: 0
//     },
//     arr: [1, {
//       bar: 2
//     }]
//   }
//   const observed = reactive(original)
//   let nestedFoo;
//   effect(() => {
//     nestedFoo = observed.nested.foo + 1
//   })
//   observed.nested.foo = 2
//   expect(nestedFoo).toBe(3)
// })