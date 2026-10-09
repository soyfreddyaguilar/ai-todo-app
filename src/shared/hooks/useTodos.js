import { useCallback, useState } from 'react'
import {
  clearTasks,
  loadTasks,
  saveTasks,
  toStorageError,
} from '../utils/localStorage.js'
import { generateTaskId } from '../utils/taskId.js'
import { validateTask } from '../utils/validation.js'

// Reads the stored list once on mount. A failure is kept as state, not thrown, so the UI can explain it.
function readInitialState() {
  try {
    const { tasks, skippedCount } = loadTasks()
    return { tasks, skippedCount, storageError: null }
  } catch (error) {
    return { tasks: [], skippedCount: 0, storageError: toStorageError(error) }
  }
}

// Single source of truth for the task list (NFR10). Mutations return { ok, ... } or { ok: false, errors }.
export function useTodos() {
  const [state, setState] = useState(readInitialState)
  const { tasks, skippedCount, storageError } = state

  // Writes the next list to localStorage synchronously in the same event that changed it (FR1, FR10).
  // Once a storage failure has been recorded, saving stays disabled for the session.
  const commitTasks = useCallback(
    (nextTasks) => {
      let nextStorageError = storageError
      if (!storageError) {
        try {
          saveTasks(nextTasks)
        } catch (error) {
          nextStorageError = toStorageError(error)
        }
      }
      setState((prev) => ({
        ...prev,
        tasks: nextTasks,
        storageError: nextStorageError,
      }))
    },
    [storageError],
  )

  const addTask = useCallback(
    (input) => {
      const validation = validateTask(input)
      if (!validation.valid) {
        return { ok: false, errors: validation.errors }
      }
      const now = new Date().toISOString()
      const task = {
        id: generateTaskId(),
        title: input.title.trim(),
        description: (input.description ?? '').trim(),
        completed: false,
        createdAt: now,
        updatedAt: now,
      }
      commitTasks([task, ...tasks])
      return { ok: true, task }
    },
    [tasks, commitTasks],
  )

  // Edit always supplies both fields; validation applies to the full edited content (FR6).
  const updateTask = useCallback(
    (id, changes) => {
      const validation = validateTask(changes)
      if (!validation.valid) {
        return { ok: false, errors: validation.errors }
      }
      const updatedAt = new Date().toISOString()
      commitTasks(
        tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                title: changes.title.trim(),
                description: changes.description.trim(),
                updatedAt,
              }
            : task,
        ),
      )
      return { ok: true }
    },
    [tasks, commitTasks],
  )

  const toggleTask = useCallback(
    (id) => {
      const updatedAt = new Date().toISOString()
      commitTasks(
        tasks.map((task) =>
          task.id === id
            ? { ...task, completed: !task.completed, updatedAt }
            : task,
        ),
      )
    },
    [tasks, commitTasks],
  )

  const deleteTask = useCallback(
    (id) => {
      commitTasks(tasks.filter((task) => task.id !== id))
    },
    [tasks, commitTasks],
  )

  // Used after corrupt data is reported: removes the stored key and starts from an empty list (NFR8).
  const clearAllTasks = useCallback(() => {
    try {
      clearTasks()
      setState({ tasks: [], skippedCount: 0, storageError: null })
    } catch (error) {
      setState((prev) => ({ ...prev, storageError: toStorageError(error) }))
    }
  }, [])

  return {
    tasks,
    skippedCount,
    storageError,
    isSaveDisabled: storageError !== null,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    clearAllTasks,
  }
}
