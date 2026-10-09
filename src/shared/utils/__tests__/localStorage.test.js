import { describe, expect, it, vi } from 'vitest'
import {
  STORAGE_ERROR_CODES,
  STORAGE_KEY,
  StorageError,
  clearTasks,
  loadTasks,
  saveTasks,
} from '../localStorage.js'

const task = (overrides = {}) => ({
  id: '20261009143000000',
  title: 'Buy groceries',
  description: 'Milk, bread, eggs',
  completed: false,
  createdAt: '2026-10-09T14:30:00.000Z',
  updatedAt: '2026-10-09T14:30:00.000Z',
  ...overrides,
})

// Builds a Storage-like object whose methods can be forced to fail.
const fakeStorage = (overrides = {}) => {
  const data = {}
  return {
    getItem: vi.fn((key) => (key in data ? data[key] : null)),
    setItem: vi.fn((key, value) => {
      data[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete data[key]
    }),
    ...overrides,
  }
}

describe('localStorage utilities', () => {
  it('saves the task list as JSON under the todos-app-data key', () => {
    const storage = fakeStorage()

    saveTasks([task()], storage)

    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify([task()]),
    )
    expect(STORAGE_KEY).toBe('todos-app-data')
  })

  it('returns an empty list when nothing has been stored yet', () => {
    expect(loadTasks(fakeStorage())).toEqual({ tasks: [], skippedCount: 0 })
  })

  it('round-trips tasks with the full schema {id, title, description, completed, createdAt, updatedAt}', () => {
    const storage = fakeStorage()
    saveTasks([task({ completed: true })], storage)

    const { tasks, skippedCount } = loadTasks(storage)

    expect(skippedCount).toBe(0)
    expect(tasks).toEqual([task({ completed: true })])
  })

  it('overwrites the stored record when a task is updated', () => {
    const storage = fakeStorage()
    saveTasks([task()], storage)

    saveTasks(
      [task({ title: 'Buy oat milk', updatedAt: '2026-10-09T15:00:00.000Z' })],
      storage,
    )

    expect(loadTasks(storage).tasks[0].title).toBe('Buy oat milk')
  })

  it('removes a deleted task from the stored list', () => {
    const storage = fakeStorage()
    saveTasks(
      [task({ id: '20261009143000000' }), task({ id: '20261009143100000' })],
      storage,
    )

    saveTasks([task({ id: '20261009143100000' })], storage)

    expect(loadTasks(storage).tasks.map((t) => t.id)).toEqual([
      '20261009143100000',
    ])
  })

  it('reports QUOTA_EXCEEDED when the browser refuses a write for lack of space', () => {
    const quotaError = Object.assign(
      new Error('The quota has been exceeded.'),
      { name: 'QuotaExceededError' },
    )
    const storage = fakeStorage({
      setItem: vi.fn(() => {
        throw quotaError
      }),
    })

    let caught
    try {
      saveTasks([task()], storage)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(StorageError)
    expect(caught.code).toBe(STORAGE_ERROR_CODES.QUOTA_EXCEEDED)
    expect(caught.cause).toBe(quotaError)
  })

  it('reports PARSE_ERROR for stored data that is not valid JSON', () => {
    const storage = fakeStorage()
    storage.setItem(STORAGE_KEY, '{not json')

    expect(() => loadTasks(storage)).toThrow(StorageError)
    try {
      loadTasks(storage)
    } catch (error) {
      expect(error.code).toBe(STORAGE_ERROR_CODES.PARSE_ERROR)
    }
  })

  it('removes only the task key when clearing and leaves other keys untouched', () => {
    const storage = fakeStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify([task()]))
    storage.setItem('todos-app-theme', 'dark')

    clearTasks(storage)

    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(storage.getItem('todos-app-theme')).toBe('dark')
  })
})
