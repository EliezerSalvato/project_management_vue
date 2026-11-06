import type { Validator } from './types'

type WordOptions = {
  /** Words shorter than this (in characters) are not counted. */
  minLength?: number
}

// JS `\s` covers Unicode whitespace (U+00A0, U+2000-U+200A, U+3000...), matching the API's Project::Text.
export function countWords(value: unknown, { minLength = 1 }: WordOptions = {}): number {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text === '') return 0

  return text.split(/\s+/).filter((word) => [...word].length >= minLength).length
}

export function minWordsValidator(
  minimum: number,
  message: string,
  options: WordOptions = {},
): Validator {
  return (value) => ({
    isValid: countWords(value, options) >= minimum,
    errorMessage: message,
  })
}
