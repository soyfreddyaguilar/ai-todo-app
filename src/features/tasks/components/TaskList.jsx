import TaskItem from './TaskItem.jsx'

// Renders the already filtered and ordered task list, or the empty state message (FR2).
export default function TaskList({
  tasks,
  emptyMessage,
  onToggle,
  onUpdate,
  onDelete,
}) {
  if (tasks.length === 0) {
    return (
      <p className="empty-state" data-testid="empty-state">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="task-list" data-testid="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
