import { FILTERS } from '../../../shared/utils/taskFilters.js'

const OPTIONS = [
  { value: FILTERS.ALL, label: 'All', testId: 'filter-all' },
  { value: FILTERS.PENDING, label: 'Pending', testId: 'filter-pending' },
  { value: FILTERS.COMPLETED, label: 'Completed', testId: 'filter-completed' },
]

// Status filters with live counters (FR4).
export default function FilterButtons({ activeFilter, counts, onChange }) {
  return (
    <div className="filters" role="group" aria-label="Filter tasks">
      {OPTIONS.map((option) => {
        const isActive = activeFilter === option.value
        return (
          <button
            key={option.value}
            type="button"
            data-testid={option.testId}
            className={isActive ? 'filter-button active' : 'filter-button'}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
          >
            {option.label} ({counts[option.value]})
          </button>
        )
      })}
    </div>
  )
}
