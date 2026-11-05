import { ApiError } from '@/api/client'
import { useFormErrors } from '@/composables/useFormErrors'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/locales'

beforeEach(() => {
  i18n.global.locale.value = 'en'
})

function apiError(message: string, details: Record<string, string[]> = {}) {
  return new ApiError(422, { status: 'error', message, details })
}

describe('useFormErrors', () => {
  it('starts with empty errors for every field plus base', () => {
    const { errors } = useFormErrors({ email: '', password: '' })

    expect(errors.value).toEqual({ email: [], password: [], base: [] })
  })

  it('validateWith updates errors and returns validity', () => {
    const form = reactive({ email: '', password: 'secret' })
    const { errors, validateWith } = useFormErrors(form)

    expect(validateWith((handler) => handler.checkBlank(['email', 'password']))).toBe(false)
    expect(errors.value.email).toEqual(["can't be blank"])

    form.email = 'ada@example.com'

    expect(validateWith((handler) => handler.checkBlank(['email', 'password']))).toBe(true)
    expect(errors.value.email).toEqual([])
  })

  it('reads the latest form when given a getter', () => {
    let form = { email: '' }
    const { validateWith } = useFormErrors(() => form)

    form = { email: 'ada@example.com' }

    expect(validateWith((handler) => handler.checkBlank(['email']))).toBe(true)
  })

  it('applyCatch maps ApiError details to fields', () => {
    const { errors, applyCatch } = useFormErrors({ email: '', passwordConfirmation: '' })

    applyCatch(
      apiError('Validation failed', {
        email: ['has already been taken'],
        password_confirmation: ["doesn't match"],
      }),
    )

    expect(errors.value).toEqual({
      email: ['has already been taken'],
      passwordConfirmation: ["doesn't match"],
      base: [],
    })
  })

  it('applyCatch uses the ApiError message when there are no details', () => {
    const { errors, applyCatch } = useFormErrors({ email: '' })

    applyCatch(apiError('Invalid credentials'))

    expect(errors.value.base).toEqual(['Invalid credentials'])
  })

  it('applyCatch shows a generic message for unexpected errors', () => {
    const { errors, applyCatch } = useFormErrors({ email: '' })

    applyCatch(new TypeError('Failed to fetch'))

    expect(errors.value.base).toEqual(['Something went wrong. Please try again.'])
  })

  it('applyCatch replaces previous errors', () => {
    const { errors, validateWith, applyCatch } = useFormErrors({ email: '' })

    validateWith((handler) => handler.checkBlank(['email']))
    applyCatch(apiError('Server down'))

    expect(errors.value).toEqual({ email: [], base: ['Server down'] })
  })

  it('resetErrors clears all errors', () => {
    const { errors, validateWith, resetErrors } = useFormErrors({ email: '' })

    validateWith((handler) => handler.checkBlank(['email']))
    resetErrors()

    expect(errors.value).toEqual({ email: [], base: [] })
  })
})
