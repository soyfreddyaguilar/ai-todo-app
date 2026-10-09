import { useState } from 'react'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  countCharacters,
} from '../../../shared/utils/validation.js'

// Create form: title (required, max 500) and description (optional, max 2000) with live character counters (FR1, FR9).
export default function TaskForm({ onCreate, isDisabled }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})

  const titleRemaining = TITLE_MAX_LENGTH - countCharacters(title)
  const descriptionRemaining =
    DESCRIPTION_MAX_LENGTH - countCharacters(description)

  function handleSubmit(event) {
    event.preventDefault()
    if (isDisabled) return

    const result = onCreate({ title, description })
    if (result.ok) {
      setTitle('')
      setDescription('')
      setErrors({})
    } else {
      setErrors(result.errors)
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="task-title-input">Title</label>
        <input
          id="task-title-input"
          data-testid="task-title-input"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to be done?"
          aria-invalid={Boolean(errors.title) || titleRemaining < 0}
          aria-describedby="title-counter"
        />
        <span
          id="title-counter"
          data-testid="title-counter"
          className={titleRemaining < 0 ? 'counter over-limit' : 'counter'}
        >
          {titleRemaining} characters left
        </span>
      </div>

      <div className="field">
        <label htmlFor="task-description-input">Description (optional)</label>
        <textarea
          id="task-description-input"
          data-testid="task-description-input"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={Boolean(errors.description) || descriptionRemaining < 0}
          aria-describedby="description-counter"
        />
        <span
          id="description-counter"
          data-testid="description-counter"
          className={
            descriptionRemaining < 0 ? 'counter over-limit' : 'counter'
          }
        >
          {descriptionRemaining} characters left
        </span>
      </div>

      <button
        type="submit"
        className="primary-button"
        data-testid="create-task-button"
        disabled={isDisabled}
      >
        Create
      </button>
    </form>
  )
}
