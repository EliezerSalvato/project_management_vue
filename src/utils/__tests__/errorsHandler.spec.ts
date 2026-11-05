import { ErrorsHandler, buildFormErrors } from '@/utils/errorsHandler'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/locales'

beforeEach(() => {
  i18n.global.locale.value = 'en'
})

function buildForm(overrides = {}) {
  return {
    email: '',
    password: '',
    passwordConfirmation: '',
    ...overrides,
  }
}

describe('buildFormErrors', () => {
  it('creates an empty list for each field plus base', () => {
    expect(buildFormErrors({ email: '', password: '' })).toEqual({
      email: [],
      password: [],
      base: [],
    })
  })
})

describe('ErrorsHandler', () => {
  it('starts valid', () => {
    expect(new ErrorsHandler(buildForm()).isValid).toBe(true)
  })

  it('collects blank errors and becomes invalid', () => {
    const handler = new ErrorsHandler(buildForm({ password: 'x' })).checkBlank([
      'email',
      'password',
    ])

    expect(handler.isValid).toBe(false)
    expect(handler.all.email).toEqual(["can't be blank"])
    expect(handler.all.password).toEqual([])
  })

  it('does not duplicate the same message on a field', () => {
    const handler = new ErrorsHandler(buildForm()).add('email', 'taken').add('email', 'taken')

    expect(handler.all.email).toEqual(['taken'])
  })

  it('chains multiple validations on the same field', () => {
    const handler = new ErrorsHandler(buildForm({ email: 'a' }))
      .checkEmail(['email'])
      .checkMinLength(['email'], 3)

    expect(handler.all.email).toEqual(['is invalid', 'is too short (minimum is 3 characters)'])
  })

  it('checks max length', () => {
    const handler = new ErrorsHandler(buildForm({ password: 'abcd' })).checkMaxLength(
      ['password'],
      3,
    )

    expect(handler.all.password).toEqual(['is too long (maximum is 3 characters)'])
  })

  it('adds confirmation errors to the confirmation field', () => {
    const handler = new ErrorsHandler(
      buildForm({ password: 'secret123', passwordConfirmation: 'other' }),
    ).checkConfirmation('password', 'passwordConfirmation', 'Password')

    expect(handler.all.password).toEqual([])
    expect(handler.all.passwordConfirmation).toEqual(["doesn't match Password"])
  })

  it('adds the generic base error', () => {
    const handler = new ErrorsHandler(buildForm()).addSomethingWentWrong()

    expect(handler.all.base).toEqual(['Something went wrong. Please try again.'])
    expect(handler.isValid).toBe(false)
  })

  describe('applyApiDetails', () => {
    it('maps snake_case API fields to camelCase form fields', () => {
      const handler = new ErrorsHandler(buildForm()).applyApiDetails({
        email: ['has already been taken'],
        password_confirmation: ["doesn't match"],
      })

      expect(handler.all.email).toEqual(['has already been taken'])
      expect(handler.all.passwordConfirmation).toEqual(["doesn't match"])
    })

    it('sends unknown fields to base', () => {
      const handler = new ErrorsHandler(buildForm()).applyApiDetails({ token: ['is expired'] })

      expect(handler.all.base).toEqual(['is expired'])
    })

    it('uses the fallback message when no details are reported', () => {
      const handler = new ErrorsHandler(buildForm()).applyApiDetails(
        { email: [] },
        'Invalid credentials',
      )

      expect(handler.all.base).toEqual(['Invalid credentials'])
      expect(handler.all.email).toEqual([])
    })

    it('ignores the fallback when details are reported', () => {
      const handler = new ErrorsHandler(buildForm()).applyApiDetails(
        { email: ['is invalid'] },
        'Validation failed',
      )

      expect(handler.all.base).toEqual([])
    })
  })
})
