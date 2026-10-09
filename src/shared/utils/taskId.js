// Task IDs use the timestamp format YYYYMMDDHHMMSSMMM (17 digits, local time), per FR1.
const TASK_ID_PATTERN = /^\d{17}$/

let lastTimestamp = 0

function pad(value, width = 2) {
  return String(value).padStart(width, '0')
}

export function formatTaskId(date) {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}` +
    pad(date.getMilliseconds(), 3)
  )
}

// Timestamps are forced to be strictly increasing so rapid creates in the same millisecond stay unique.
export function generateTaskId(now = new Date()) {
  const timestamp = Math.max(now.getTime(), lastTimestamp + 1)
  lastTimestamp = timestamp
  return formatTaskId(new Date(timestamp))
}

// Returns the task's ID when it has the expected format, otherwise null.
export function extractTaskId(task) {
  const id = task?.id
  return typeof id === 'string' && TASK_ID_PATTERN.test(id) ? id : null
}
