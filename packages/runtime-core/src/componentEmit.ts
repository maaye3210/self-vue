export function emit(instance, event, ...args) {
  console.log(event)
  const { props } = instance
  const handler = props['on' + capitalize(event)]
  handler && handler(...args)
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}