// Input validation rules for task title and description (FR1, FR6, FR9).
export const TITLE_MAX_LENGTH = 500
export const DESCRIPTION_MAX_LENGTH = 2000

export const VALIDATION_MESSAGES = {
  titleRequired: 'Title is required.',
  titleTooLong: `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`,
  descriptionTooLong: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`,
}

// Counts user-perceived characters by Unicode code point (an emoji counts as one character).
export function countCharacters(text) {
  return Array.from(text ?? '').length
}

export function validateTitle(title) {
  const value = title ?? ''
  if (value.trim().length === 0) {
    return VALIDATION_MESSAGES.titleRequired
  }
  if (countCharacters(value) > TITLE_MAX_LENGTH) {
    return VALIDATION_MESSAGES.titleTooLong
  }
  return null
}

export function validateDescription(description) {
  if (countCharacters(description) > DESCRIPTION_MAX_LENGTH) {
    return VALIDATION_MESSAGES.descriptionTooLong
  }
  return null
}

// Returns { valid, errors } where errors maps field name to message (only failing fields are present).
export function validateTask({ title, description } = {}) {
  const errors = {}
  const titleError = validateTitle(title)
  const descriptionError = validateDescription(description)
  if (titleError) errors.title = titleError
  if (descriptionError) errors.description = descriptionError
  return { valid: Object.keys(errors).length === 0, errors }
}

// Joins field errors into one human-readable message for a toast notification.
export function formatValidationErrors(errors = {}) {
  return Object.values(errors).filter(Boolean).join(' ')
}
