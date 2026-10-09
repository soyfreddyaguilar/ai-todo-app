import { useEffect, useMemo, useState } from 'react'
import './App.css'
import FilterButtons from './features/tasks/components/FilterButtons.jsx'
import TaskForm from './features/tasks/components/TaskForm.jsx'
import TaskList from './features/tasks/components/TaskList.jsx'
import Header from './shared/components/Header.jsx'
import ToastContainer from './shared/components/Toast.jsx'
import { useTheme } from './shared/hooks/useTheme.js'
import { useTodos } from './shared/hooks/useTodos.js'
import { useToast } from './shared/hooks/useToast.js'
import { STORAGE_ERROR_CODES } from './shared/utils/localStorage.js'
import {
  FILTERS,
  countTasksByFilter,
  filterTasks,
  sortNewestFirst,
} from './shared/utils/taskFilters.js'
import { formatValidationErrors } from './shared/utils/validation.js'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { toasts, showToast, dismissToast } = useToast()
  const {
    tasks,
    skippedCount,
    storageError,
    isSaveDisabled,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    clearAllTasks,
  } = useTodos()
  const [filter, setFilter] = useState(FILTERS.ALL)

  // Storage failures are surfaced once when they occur (FR10).
  useEffect(() => {
    if (storageError) {
      showToast(storageError.message, 'error')
    }
  }, [storageError, showToast])

  // Malformed stored records are reported, not silently dropped (NFR8).
  useEffect(() => {
    if (skippedCount > 0) {
      showToast(
        `${skippedCount} saved task record(s) were malformed and were skipped.`,
        'status',
      )
    }
  }, [skippedCount, showToast])

  const orderedTasks = useMemo(() => sortNewestFirst(tasks), [tasks])
  const visibleTasks = useMemo(
    () => filterTasks(orderedTasks, filter),
    [orderedTasks, filter],
  )
  const counts = useMemo(() => countTasksByFilter(tasks), [tasks])

  function handleCreate(input) {
    const result = addTask(input)
    if (!result.ok) {
      showToast(formatValidationErrors(result.errors), 'error')
    }
    return result
  }

  function handleUpdate(id, changes) {
    const result = updateTask(id, changes)
    if (!result.ok) {
      showToast(formatValidationErrors(result.errors), 'error')
    }
    return result
  }

  const emptyMessage =
    tasks.length === 0
      ? 'No tasks yet. Add your first task above.'
      : 'No tasks match this filter.'

  return (
    <div className="app" data-testid="app-root" data-theme={theme}>
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="app-main">
        <TaskForm onCreate={handleCreate} isDisabled={isSaveDisabled} />

        {storageError?.code === STORAGE_ERROR_CODES.PARSE_ERROR && (
          <button
            type="button"
            className="secondary-button"
            data-testid="clear-stored-data"
            onClick={clearAllTasks}
          >
            Clear saved data
          </button>
        )}

        <FilterButtons
          activeFilter={filter}
          counts={counts}
          onChange={setFilter}
        />

        <TaskList
          tasks={visibleTasks}
          emptyMessage={emptyMessage}
          onToggle={toggleTask}
          onUpdate={handleUpdate}
          onDelete={deleteTask}
        />
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
