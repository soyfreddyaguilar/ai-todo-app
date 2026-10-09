// Integration tests at the localStorage boundary: the App runs against jsdom's real localStorage.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../../../App.jsx'

const STORAGE_KEY = 'todos-app-data'

const storedTasks = () =>
  JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')

const task = (overrides) => ({
  id: '20261009143000000',
  title: 'Seeded task',
  description: '',
  completed: false,
  createdAt: '2026-10-09T14:30:00.000Z',
  updatedAt: '2026-10-09T14:30:00.000Z',
  ...overrides,
})

describe('localStorage integration', () => {
  it('create, list, then persist: a created task is still listed after a page refresh', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.type(screen.getByTestId('task-title-input'), 'Renew passport')
    await user.click(screen.getByTestId('create-task-button'))
    expect(screen.getAllByTestId('task-item')).toHaveLength(1)

    first.unmount()
    render(<App />)

    expect(screen.getByTestId('task-title')).toHaveTextContent('Renew passport')
    expect(storedTasks()).toHaveLength(1)
    expect(storedTasks()[0].title).toBe('Renew passport')
  })

  it('edit then sync: an edited title is written to localStorage immediately', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([task({})]))
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByTestId('task-title'))
    const input = screen.getByTestId('edit-title-input')
    await user.clear(input)
    await user.type(input, 'Edited title')
    // Focus moving title -> description stays inside the edit area and must not save yet.
    expect(storedTasks()[0].title).toBe('Seeded task')
    // Clicking outside the row blurs the edit area, which saves it.
    await user.click(document.body)

    expect(storedTasks()[0].title).toBe('Edited title')
    expect(storedTasks()[0].updatedAt).not.toBe('2026-10-09T14:30:00.000Z')
  })

  it('delete then remove: a deleted task is removed from storage', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        task({ id: '20261009143000000' }),
        task({ id: '20261009143100000', title: 'Keep me' }),
      ]),
    )
    const user = userEvent.setup()
    render(<App />)

    const items = screen.getAllByTestId('task-item')
    const oldest = items.find(
      (item) =>
        within(item).getByTestId('task-title').textContent === 'Seeded task',
    )
    await user.click(within(oldest).getByTestId('delete-task'))

    expect(storedTasks().map((t) => t.title)).toEqual(['Keep me'])
  })

  it('quota exceeded: shows an error toast and disables saving', async () => {
    const quotaError = Object.assign(new Error('quota'), {
      name: 'QuotaExceededError',
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quotaError
    })
    const user = userEvent.setup()
    render(<App />)

    // The write happens on the change itself, so the quota failure surfaces on the first create.
    await user.type(screen.getByTestId('task-title-input'), 'Too big to save')
    await user.click(screen.getByTestId('create-task-button'))

    expect(screen.getByTestId('toast')).toHaveTextContent('Storage is full')
    expect(screen.getByTestId('create-task-button')).toBeDisabled()
  })

  it('data validation on load: skips malformed records and reports how many were skipped', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        task({ id: '20261009143000000', title: 'Valid one' }),
        { id: '', title: 'No id' },
        { description: 'No id or title' },
        'not an object',
      ]),
    )

    render(<App />)

    expect(
      screen.getAllByTestId('task-title').map((el) => el.textContent),
    ).toEqual(['Valid one'])
    expect(screen.getByTestId('toast')).toHaveTextContent(
      '3 saved task record(s) were malformed',
    )
  })

  it('storage unavailable: reports the failure and does not crash the app', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException(
        'Access is denied for this document.',
        'SecurityError',
      )
    })

    render(<App />)

    expect(screen.getByTestId('toast')).toHaveTextContent(
      'Browser storage is unavailable',
    )
    expect(screen.getByTestId('create-task-button')).toBeDisabled()
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})
