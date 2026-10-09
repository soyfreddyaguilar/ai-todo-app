// Filtering and ordering helpers for the task list (FR2, FR4).
export const FILTERS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
}

// Newest first by creation time, falling back to ID order for equal timestamps.
export function sortNewestFirst(tasks) {
  return [...tasks].sort(
    (a, b) =>
      (b.createdAt ?? '').localeCompare(a.createdAt ?? '') ||
      b.id.localeCompare(a.id),
  )
}

export function filterTasks(tasks, filter) {
  switch (filter) {
    case FILTERS.ALL:
      return tasks
    case FILTERS.PENDING:
      return tasks.filter((task) => !task.completed)
    case FILTERS.COMPLETED:
      return tasks.filter((task) => task.completed)
    default:
      throw new Error(`Unknown task filter: ${filter}`)
  }
}

export function countTasksByFilter(tasks) {
  const completed = tasks.filter((task) => task.completed).length
  return {
    [FILTERS.ALL]: tasks.length,
    [FILTERS.PENDING]: tasks.length - completed,
    [FILTERS.COMPLETED]: completed,
  }
}
