const queue: any[] = []
let isFlushPending = false
const resolvePromise = Promise.resolve()
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  queueFlush()
}

export function nextTick(fn?) {
  return fn ? resolvePromise.then(fn) : resolvePromise
}

function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
}

function flushJobs() {
  isFlushPending = false;
  let job
  while (job = queue.shift()) {
    job && job()
  }
}
