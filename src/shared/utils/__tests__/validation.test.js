import { describe, expect, it } from 'vitest'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  VALIDATION_MESSAGES,
  formatValidationErrors,
  validateDescription,
  validateTask,
  validateTitle,
} from '../validation.js'

describe('validation', () => {
  it('rejects an empty title with the required message', () => {
    expect(validateTitle('')).toBe(VALIDATION_MESSAGES.titleRequired)
    expect(validateTitle(undefined)).toBe(VALIDATION_MESSAGES.titleRequired)
  })

  it('rejects a whitespace-only title', () => {
    expect(validateTitle('   \t  ')).toBe(VALIDATION_MESSAGES.titleRequired)
  })

  it('accepts a plain alphanumeric title', () => {
    expect(validateTitle('Task 42')).toBeNull()
  })

  it('enforces the title maximum of 500 and the description maximum of 2000 characters', () => {
    expect(validateTitle('a'.repeat(TITLE_MAX_LENGTH))).toBeNull()
    expect(validateTitle('a'.repeat(TITLE_MAX_LENGTH + 1))).toBe(
      VALIDATION_MESSAGES.titleTooLong,
    )
    expect(validateDescription('d'.repeat(DESCRIPTION_MAX_LENGTH))).toBeNull()
    expect(validateDescription('d'.repeat(DESCRIPTION_MAX_LENGTH + 1))).toBe(
      VALIDATION_MESSAGES.descriptionTooLong,
    )
  })

  it('accepts special characters in title and description', () => {
    expect(
      validateTask({
        title: '<b>Buy</b> & "sell" #1 100%',
        description: "O'Reilly; DROP TABLE x;",
      }).valid,
    ).toBe(true)
  })

  it('counts Unicode characters by code point, so one emoji counts as one character', () => {
    const emojiTitle = '😀'.repeat(TITLE_MAX_LENGTH)
    expect(validateTitle(emojiTitle)).toBeNull()
    expect(validateTitle(`${emojiTitle}😀`)).toBe(
      VALIDATION_MESSAGES.titleTooLong,
    )
  })

  it('collects an error for each invalid field and formats them for a toast', () => {
    const result = validateTask({
      title: '   ',
      description: 'd'.repeat(DESCRIPTION_MAX_LENGTH + 1),
    })

    expect(result.valid).toBe(false)
    expect(Object.keys(result.errors).sort()).toEqual(['description', 'title'])
    expect(formatValidationErrors(result.errors)).toBe(
      `${VALIDATION_MESSAGES.titleRequired} ${VALIDATION_MESSAGES.descriptionTooLong}`,
    )
    expect(formatValidationErrors({})).toBe('')
  })
})
