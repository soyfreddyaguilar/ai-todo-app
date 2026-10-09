import { useCallback, useRef, useState } from 'react'

export const TOAST_DURATION_MS = 5000

// Toast queue for validation and storage feedback (FR9, FR10). Toasts auto-dismiss.
export function useToast(durationMs = TOAST_DURATION_MS) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = 'error') => {
      const id = nextId.current
      nextId.current += 1
      setToasts((prev) => [...prev, { id, message, type }])
      window.setTimeout(() => dismissToast(id), durationMs)
    },
    [dismissToast, durationMs],
  )

  return { toasts, showToast, dismissToast }
}
