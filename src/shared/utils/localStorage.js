// localStorage persistence for tasks (FR10, NFR8). Key and schema are fixed by the requirements.
export const STORAGE_KEY = 'todos-app-data'

export const STORAGE_ERROR_CODES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PARSE_ERROR: 'PARSE_ERROR',
  ACCESS_DENIED: 'ACCESS_DENIED',
  WRITE_FAILED: 'WRITE_FAILED',
}

const USER_MESSAGES = {
  QUOTA_EXCEEDED: 'Storage is full. Changes are not being saved.',
  PARSE_ERROR: 'Saved task data is corrupt and could not be read.',
  ACCESS_DENIED: 'Browser storage is unavailable. Changes are not being saved.',
  WRITE_FAILED: 'Could not save changes to browser storage.',
}

export class StorageError extends Error {
  constructor(code, options) {
    super(USER_MESSAGES[code] ?? USER_MESSAGES.WRITE_FAILED, options)
    this.name = 'StorageError'
    this.code = code
  }
}

export function toStorageError(error) {
  return error instanceof StorageError
    ? error
    : new StorageError(STORAGE_ERROR_CODES.WRITE_FAILED, { cause: error })
}

function isQuotaError(error) {
  return (
    error?.name === 'QuotaExceededError' ||
    error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error?.code === 22 ||
    error?.code === 1014
  )
}

// Returns the Storage object or throws ACCESS_DENIED (disabled storage raises on access).
export function getStorage() {
  try {
    const storage = window.localStorage
    if (!storage) throw new Error('localStorage is not defined')
    return storage
  } catch (cause) {
    throw new StorageError(STORAGE_ERROR_CODES.ACCESS_DENIED, { cause })
  }
}

// A record is usable only if it has the required presence fields (NFR8: id and title).
export function isValidTaskRecord(record) {
  return (
    record !== null &&
    typeof record === 'object' &&
    typeof record.id === 'string' &&
    record.id.length > 0 &&
    typeof record.title === 'string' &&
    record.title.length > 0
  )
}

function normalizeTaskRecord(record) {
  return {
    id: record.id,
    title: record.title,
    description:
      typeof record.description === 'string' ? record.description : '',
    completed: record.completed === true,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
  }
}

// Reads tasks. Malformed records are skipped and counted; unreadable JSON throws PARSE_ERROR.
export function loadTasks(storage = getStorage()) {
  let raw
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch (cause) {
    throw new StorageError(STORAGE_ERROR_CODES.ACCESS_DENIED, { cause })
  }

  if (raw === null) {
    return { tasks: [], skippedCount: 0 }
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (cause) {
    throw new StorageError(STORAGE_ERROR_CODES.PARSE_ERROR, { cause })
  }
  if (!Array.isArray(parsed)) {
    throw new StorageError(STORAGE_ERROR_CODES.PARSE_ERROR)
  }

  const tasks = []
  let skippedCount = 0
  for (const record of parsed) {
    if (isValidTaskRecord(record)) {
      tasks.push(normalizeTaskRecord(record))
    } else {
      skippedCount += 1
    }
  }
  return { tasks, skippedCount }
}

// Writes the full task list. Quota failures raise QUOTA_EXCEEDED so the UI can explain them.
export function saveTasks(tasks, storage = getStorage()) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch (cause) {
    const code = isQuotaError(cause)
      ? STORAGE_ERROR_CODES.QUOTA_EXCEEDED
      : STORAGE_ERROR_CODES.WRITE_FAILED
    throw new StorageError(code, { cause })
  }
}

// Removes only the task key, leaving other keys (for example the theme preference) untouched.
export function clearTasks(storage = getStorage()) {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch (cause) {
    throw new StorageError(STORAGE_ERROR_CODES.WRITE_FAILED, { cause })
  }
}
