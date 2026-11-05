import { beforeEach, describe, expect, it } from 'vitest'
import {
  blankValidator,
  confirmationValidator,
  emailValidator,
  formatValidator,
  isBlank,
  isValidEmail,
  maxLengthValidator,
  minLengthValidator,
} from '@/utils/validators'
import i18n from '@/locales'

beforeEach(() => {
  i18n.global.locale.value = 'en'
})

describe('isBlank', () => {
  it.each([null, undefined, '', '   ', []])('treats %j as blank', (value) => {
    expect(isBlank(value)).toBe(true)
  })

  it.each(['a', ' a ', 0, false, ['x'], {}])('treats %j as present', (value) => {
    expect(isBlank(value)).toBe(false)
  })
})

describe('blankValidator', () => {
  it('fails for blank values with a translated message', () => {
    expect(blankValidator('  ')).toEqual({ isValid: false, errorMessage: "can't be blank" })
  })

  it('passes for present values', () => {
    expect(blankValidator('Ada').isValid).toBe(true)
  })
})

describe('email validation', () => {
  it.each(['ada@example.com', 'a.b+c@sub.example.org'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true)
  })

  it.each(['ada', 'ada@', 'ada@example', '@example.com', 'ada @example.com'])(
    'rejects %s',
    (email) => {
      expect(isValidEmail(email)).toBe(false)
    },
  )

  it('skips blank values (blank is checked separately)', () => {
    expect(emailValidator('').isValid).toBe(true)
  })

  it('returns the invalid message', () => {
    expect(emailValidator('ada')).toEqual({ isValid: false, errorMessage: 'is invalid' })
  })
})

describe('length validators', () => {
  it('validates minimum length inclusively', () => {
    const validator = minLengthValidator(6)

    expect(validator('12345').isValid).toBe(false)
    expect(validator('123456').isValid).toBe(true)
    expect(validator('12345').errorMessage).toBe('is too short (minimum is 6 characters)')
  })

  it('validates maximum length inclusively', () => {
    const validator = maxLengthValidator(3)

    expect(validator('abc').isValid).toBe(true)
    expect(validator('abcd').isValid).toBe(false)
    expect(validator('abcd').errorMessage).toBe('is too long (maximum is 3 characters)')
  })

  it('skips blank values', () => {
    expect(minLengthValidator(6)('').isValid).toBe(true)
  })
})

describe('confirmationValidator', () => {
  const validator = confirmationValidator('secret123', 'Password')

  it('passes when values match', () => {
    expect(validator('secret123').isValid).toBe(true)
  })

  it('fails when values differ', () => {
    expect(validator('other')).toEqual({ isValid: false, errorMessage: "doesn't match Password" })
  })

  it('skips blank values', () => {
    expect(validator('').isValid).toBe(true)
  })
})

describe('formatValidator', () => {
  it('validates against the pattern', () => {
    const validator = formatValidator(/^\d+$/)

    expect(validator('123').isValid).toBe(true)
    expect(validator('12a')).toEqual({ isValid: false, errorMessage: 'is invalid' })
  })

  it('uses a custom error message', () => {
    expect(formatValidator(/^\d+$/, 'digits only')('x').errorMessage).toBe('digits only')
  })
})

describe('translations', () => {
  it('follows the active locale', () => {
    i18n.global.locale.value = 'pt-BR'

    expect(blankValidator('').errorMessage).toBe('não pode ficar em branco')
  })
})
