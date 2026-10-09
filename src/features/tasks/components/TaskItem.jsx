import { useRef, useState } from 'react'

// One task row with completion toggle, inline edit (save on blur or Enter, cancel on Escape) and delete (FR3, FR5, FR6).
export default function TaskItem({ task, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(task.title)
  const [draftDescription, setDraftDescription] = useState(task.description)
  // Ref mirrors edit mode synchronously so a blur fired after Enter or Escape cannot save twice.
  const editingRef = useRef(false)

  function beginEdit() {
    setDraftTitle(task.title)
    setDraftDescription(task.description)
    editingRef.current = true
    setIsEditing(true)
  }

  function commitEdit() {
    if (!editingRef.current) return
    const result = onUpdate(task.id, {
      title: draftTitle,
      description: draftDescription,
    })
    if (result.ok) {
      editingRef.current = false
      setIsEditing(false)
    }
  }

  function cancelEdit() {
    editingRef.current = false
    setIsEditing(false)
  }

  // Blur saves only when focus leaves the whole edit area (moving from title to description keeps editing).
  function handleEditBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      commitEdit()
    }
  }

  function handleTitleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitEdit()
    } else if (event.key === 'Escape') {
      cancelEdit()
    }
  }

  function handleDescriptionKeyDown(event) {
    if (event.key === 'Escape') {
      cancelEdit()
    }
  }

  const itemClass = task.completed ? 'task-item completed' : 'task-item'

  return (
    <li className={itemClass} data-testid="task-item">
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={`Mark "${task.title}" as ${task.completed ? 'pending' : 'completed'}`}
      />

      <div className="task-body">
        {isEditing ? (
          <div className="task-edit" onBlur={handleEditBlur}>
            <input
              type="text"
              data-testid="edit-title-input"
              aria-label="Edit title"
              value={draftTitle}
              autoFocus
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={handleTitleKeyDown}
            />
            <textarea
              data-testid="edit-description-input"
              aria-label="Edit description"
              rows={2}
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              onKeyDown={handleDescriptionKeyDown}
            />
          </div>
        ) : (
          <>
            <button
              type="button"
              className="task-title"
              data-testid="task-title"
              onClick={beginEdit}
              aria-label={`Edit task: ${task.title}`}
            >
              {task.title}
            </button>
            {task.description && (
              <p className="task-description" data-testid="task-description">
                {task.description}
              </p>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        className="delete-button"
        data-testid="delete-task"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete task: ${task.title}`}
      >
        Delete
      </button>
    </li>
  )
}
