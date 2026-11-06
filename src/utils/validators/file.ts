import type { ValidationResult } from './types'
import i18n from '@/locales'

export const COVER_FILE_TYPES = ['image/jpeg', 'image/png']
export const COVER_FILE_MAX_BYTES = 5 * 1024 * 1024

export function coverFileValidator(file: File | null): ValidationResult {
  const isValid =
    file !== null && COVER_FILE_TYPES.includes(file.type) && file.size <= COVER_FILE_MAX_BYTES

  return { isValid, errorMessage: i18n.global.t('utils.validators.coverFile') }
}
