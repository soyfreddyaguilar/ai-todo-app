// BDD acceptance scenarios (Gherkin-style Given/When/Then), one per acceptance criterion.
// Written BEFORE the implementation (red first). Team rule: methodology bdd, ordering scenario-first.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import App from '../../../App.jsx'

// Vitest runs from the project root (npm scripts), so the stylesheet path is root-relative.
const APP_CSS_PATH = resolve(process.cwd(), 'src/App.css')
const STORAGE_KEY = 'todos-app-data'
const THEME_KEY = 'todos-app-theme'
const ID_PATTERN = /^\d{17}$/

const storedTasks = () =>
  JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')

const seedTasks = (tasks) =>
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))

const makeTask = (overrides) => ({
  id: '20261009143000000',
  title: 'Task',
  description: '',
  completed: false,
  createdAt: '2026-10-09T14:30:00.000Z',
  updatedAt: '2026-10-09T14:30:00.000Z',
  ...overrides,
})

describe('Feature: Task management (acceptance scenarios)', () => {
  describe('Scenario: Create task with title and description (FR1 / AC1)', () => {
    it('shows the new task in the list with a timestamp ID and timestamps', async () => {
      // Given the input form is displayed
      const user = userEvent.setup()
      render(<App />)

      // When the user enters a title and description and clicks Create
      await user.type(screen.getByTestId('task-title-input'), 'Buy groceries')
      await user.type(
        screen.getByTestId('task-description-input'),
        'Milk, bread',
      )
      await user.click(screen.getByTestId('create-task-button'))

      // Then the task appears in the list immediately
      const items = screen.getAllByTestId('task-item')
      expect(items).toHaveLength(1)
      expect(within(items[0]).getByTestId('task-title')).toHaveTextContent(
        'Buy groceries',
      )

      // And it has a unique YYYYMMDDHHMMSSMMM ID plus createdAt and updatedAt
      const [task] = storedTasks()
      expect(task.id).toMatch(ID_PATTERN)
      expect(task).toMatchObject({
        title: 'Buy groceries',
        description: 'Milk, bread',
        completed: false,
      })
      expect(task.createdAt).toBeTruthy()
      expect(task.updatedAt).toBeTruthy()
    })
  })

  describe('Scenario: Form resets after creation (FR1 / AC1)', () => {
    it('clears the title and description fields after a successful create', async () => {
      // Given the user has created a task
      const user = userEvent.setup()
      render(<App />)
      await user.type(screen.getByTestId('task-title-input'), 'Water plants')
      await user.type(
        screen.getByTestId('task-description-input'),
        'Balcony only',
      )

      // When the form is submitted
      await user.click(screen.getByTestId('create-task-button'))

      // Then the input fields are cleared and ready for the next entry
      expect(screen.getByTestId('task-title-input')).toHaveValue('')
      expect(screen.getByTestId('task-description-input')).toHaveValue('')
    })
  })

  describe('Scenario: List tasks on app startup, newest first (FR2 / AC2)', () => {
    it('renders all stored tasks in descending creation order', () => {
      // Given tasks exist in localStorage (older task stored first)
      seedTasks([
        makeTask({ id: '20261009143000000', title: 'Older task' }),
        makeTask({
          id: '20261009143100000',
          title: 'Newer task',
          createdAt: '2026-10-09T14:31:00.000Z',
          updatedAt: '2026-10-09T14:31:00.000Z',
        }),
      ])

      // When the app loads
      render(<App />)

      // Then all tasks appear, newest first
      const titles = screen
        .getAllByTestId('task-title')
        .map((el) => el.textContent)
      expect(titles).toEqual(['Newer task', 'Older task'])
    })
  })

  describe('Scenario: Show empty state (FR2 / AC2)', () => {
    it('displays the empty state message when no tasks exist', () => {
      // Given no tasks in localStorage
      // When the app loads
      render(<App />)

      // Then the empty state message is displayed and no items are listed
      expect(screen.getByTestId('empty-state')).toHaveTextContent(/no tasks/i)
      expect(screen.queryAllByTestId('task-item')).toHaveLength(0)
    })
  })

  describe('Scenario: Toggle task completion (FR3 / AC3)', () => {
    it('marks the task completed with visual feedback and persists the change', async () => {
      // Given a pending task is displayed in the list
      seedTasks([makeTask({ id: '20261009143000000', title: 'Pay rent' })])
      const user = userEvent.setup()
      render(<App />)

      // When the user clicks the completion checkbox
      const item = screen.getByTestId('task-item')
      await user.click(within(item).getByRole('checkbox'))

      // Then the task shows the completed state (class used for strikethrough and green styling)
      expect(within(item).getByRole('checkbox')).toBeChecked()
      expect(item).toHaveClass('completed')
      // And the completion state is saved to localStorage immediately
      expect(storedTasks()[0].completed).toBe(true)
    })
  })

  describe('Scenario: Filter tasks by status (FR4 / AC4)', () => {
    it('shows only completed tasks with the correct count when Completed is selected', async () => {
      // Given mixed completed and pending tasks exist
      seedTasks([
        makeTask({ id: '20261009143000000', title: 'Done A', completed: true }),
        makeTask({
          id: '20261009143100000',
          title: 'Open B',
          completed: false,
        }),
        makeTask({ id: '20261009143200000', title: 'Done C', completed: true }),
      ])
      const user = userEvent.setup()
      render(<App />)

      // When the user selects the Completed filter
      await user.click(screen.getByTestId('filter-completed'))

      // Then only completed tasks are displayed, with the filter counter showing 2
      const titles = screen
        .getAllByTestId('task-title')
        .map((el) => el.textContent)
      expect(titles).toEqual(['Done C', 'Done A'])
      expect(screen.getByTestId('filter-completed')).toHaveTextContent('2')
    })
  })

  describe('Scenario: Delete task (FR5 / AC5)', () => {
    it('removes the task from the list and from localStorage', async () => {
      // Given a task exists in the list
      seedTasks([makeTask({ id: '20261009143000000', title: 'Old idea' })])
      const user = userEvent.setup()
      render(<App />)

      // When the user clicks the delete button
      await user.click(screen.getByTestId('delete-task'))

      // Then the task is removed immediately and from localStorage
      expect(screen.queryAllByTestId('task-item')).toHaveLength(0)
      expect(storedTasks()).toEqual([])
    })
  })

  describe('Scenario: Edit task inline (FR6 / AC6)', () => {
    it('saves the edited title with Enter and persists it to localStorage', async () => {
      // Given a task is displayed
      seedTasks([makeTask({ id: '20261009143000000', title: 'Draft' })])
      const user = userEvent.setup()
      render(<App />)

      // When the user clicks the title, modifies it, and presses Enter
      await user.click(screen.getByTestId('task-title'))
      const input = screen.getByTestId('edit-title-input')
      await user.clear(input)
      await user.type(input, 'Final version{Enter}')

      // Then the change is shown in the list and saved to localStorage
      expect(screen.getByTestId('task-title')).toHaveTextContent(
        'Final version',
      )
      expect(storedTasks()[0].title).toBe('Final version')
    })
  })

  describe('Scenario: Responsive layout on mobile (FR7 / AC7)', () => {
    it('defines mobile-first breakpoints and 44px touch targets in the stylesheet', () => {
      // Given the application stylesheet (static check: jsdom does not apply layout)
      const appCss = readFileSync(APP_CSS_PATH, 'utf8')
      // When the layout rules are inspected
      // Then breakpoints for tablet (768px) and desktop (1024px) exist
      expect(appCss).toMatch(/@media \(min-width: 768px\)/)
      expect(appCss).toMatch(/@media \(min-width: 1024px\)/)
      // And interactive controls have a minimum 44x44px touch target
      expect(appCss).toMatch(/min-height:\s*44px/)
      expect(appCss).toMatch(/min-width:\s*44px/)
    })
  })

  describe('Scenario: Dark mode toggle with persistence (FR8 / AC8)', () => {
    it('switches to dark theme and keeps the preference after a refresh', async () => {
      // Given the app is running in light mode
      const user = userEvent.setup()
      const first = render(<App />)
      expect(screen.getByTestId('app-root')).toHaveAttribute(
        'data-theme',
        'light',
      )

      // When the user toggles dark mode
      await user.click(screen.getByTestId('theme-toggle'))

      // Then the theme switches to dark
      expect(screen.getByTestId('app-root')).toHaveAttribute(
        'data-theme',
        'dark',
      )
      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark')

      // And the preference persists across a page refresh (remount)
      first.unmount()
      render(<App />)
      expect(screen.getByTestId('app-root')).toHaveAttribute(
        'data-theme',
        'dark',
      )
    })
  })
})
