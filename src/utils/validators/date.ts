import type { Validator } from './types'
import { parseIsoDate } from '@/utils/date'

type DateValidatorOptions = {
  /** `YYYY-MM-DD`; when set, earlier dates are invalid. */
  notBefore?: string
}

export function dateValidator({ notBefore }: DateValidatorOptions, message: string): Validator {
  return (value) => {
    const isoValue = typeof value === 'string' ? value : ''
    const date = parseIsoDate(isoValue)
    if (!date) return { isValid: false, errorMessage: message }

    const limit = notBefore ? parseIsoDate(notBefore) : null

    return { isValid: !limit || date >= limit, errorMessage: message }
  }
}
