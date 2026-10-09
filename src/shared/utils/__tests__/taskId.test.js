import { describe, expect, it } from 'vitest'
import { extractTaskId, formatTaskId, generateTaskId } from '../taskId.js'

describe('taskId utilities', () => {
  it('formats IDs as YYYYMMDDHHMMSSMMM (17 digits, local time)', () => {
    const date = new Date(2026, 9, 9, 14, 30, 0, 5) // 2026-10-09 14:30:00.005 local

    expect(formatTaskId(date)).toBe('20261009143000005')
    expect(generateTaskId(date)).toMatch(/^\d{17}$/)
  })

  it('generates unique IDs for rapid creation within the same millisecond', () => {
    const now = new Date(2026, 9, 9, 14, 30, 0, 0)

    const ids = Array.from({ length: 1000 }, () => generateTaskId(now))

    expect(new Set(ids).size).toBe(1000)
    // Strictly increasing, so ordering by ID matches creation order.
    for (let i = 1; i < ids.length; i += 1) {
      expect(ids[i] > ids[i - 1]).toBe(true)
    }
  })

  it('extracts the ID from a task object and returns null for a malformed ID', () => {
    expect(extractTaskId({ id: '20261009143000000', title: 'Task' })).toBe(
      '20261009143000000',
    )
    expect(extractTaskId({ id: 'abc' })).toBeNull()
    expect(extractTaskId({ title: 'no id' })).toBeNull()
    expect(extractTaskId(null)).toBeNull()
  })
})
