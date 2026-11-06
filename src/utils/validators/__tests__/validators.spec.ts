import { beforeEach, describe, expect, it } from 'vitest'
import {
  blankValidator,
  confirmationValidator,
  COVER_FILE_MAX_BYTES,
  coverFileValidator,
  dateValidator,
  emailValidator,
  formatValidator,
  isBlank,
  isValidEmail,
  maxLengthValidator,
  minLengthValidator,
  minWordsValidator,
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

describe('minWordsValidator', () => {
  const twoWords = minWordsValidator(2, 'Por favor, digite ao menos duas palavras')
  const oneWord = minWordsValidator(1, 'Por favor, digite ao menos uma palavra')

  it('rejects fewer words than the minimum after trimming', () => {
    expect(twoWords('  Projeto  ')).toEqual({
      isValid: false,
      errorMessage: 'Por favor, digite ao menos duas palavras',
    })
    expect(twoWords('Projeto Alfa').isValid).toBe(true)
  })

  it('rejects blank values', () => {
    expect(twoWords('').isValid).toBe(false)
    expect(oneWord('   ')).toEqual({
      isValid: false,
      errorMessage: 'Por favor, digite ao menos uma palavra',
    })
    expect(oneWord(null).isValid).toBe(false)
  })

  it('accepts a single word when the minimum is 1', () => {
    expect(oneWord('Acme').isValid).toBe(true)
  })

  it('trims and splits on Unicode whitespace', () => {
    expect(twoWords('\u00a0Projeto\u00a0').isValid).toBe(false)
    expect(oneWord('\u00a0\u3000').isValid).toBe(false)
    expect(twoWords('Projeto\u00a0Alfa').isValid).toBe(true)
    expect(twoWords('Projeto\u2003Alfa').isValid).toBe(true)
  })

  it('counts only words of at least minLength characters', () => {
    const client = minWordsValidator(1, 'Por favor, digite ao menos uma palavra', { minLength: 2 })

    expect(client('')).toEqual({
      isValid: false,
      errorMessage: 'Por favor, digite ao menos uma palavra',
    })
    expect(client(' a ').isValid).toBe(false)
    expect(client('a b\u00a0c').isValid).toBe(false)
    expect(client('ab').isValid).toBe(true)
    expect(client('a Iridium').isValid).toBe(true)
    expect(client('\u00a0ab\u3000').isValid).toBe(true)
  })
})

describe('dateValidator', () => {
  const message = 'Selecione uma data válida'
  const today = '2026-11-05'

  it('rejects empty, malformed and past dates', () => {
    const validator = dateValidator({ notBefore: today }, message)

    expect(validator('')).toEqual({ isValid: false, errorMessage: message })
    expect(validator(null).isValid).toBe(false)
    expect(validator('2026-02-30').isValid).toBe(false)
    expect(validator('05/11/2026').isValid).toBe(false)
    expect(validator('2026-11-04').isValid).toBe(false)
  })

  it('accepts today and later dates', () => {
    const validator = dateValidator({ notBefore: today }, message)

    expect(validator(today).isValid).toBe(true)
    expect(validator('2027-01-01').isValid).toBe(true)
  })

  it('rejects a date before notBefore', () => {
    const validator = dateValidator({ notBefore: '2026-12-10' }, message)

    expect(validator('2026-12-09').isValid).toBe(false)
    expect(validator('2026-12-10').isValid).toBe(true)
  })

  it('still validates the date format without a not-before rule', () => {
    const validator = dateValidator({}, message)

    expect(validator('2020-01-01').isValid).toBe(true)
    expect(validator('').isValid).toBe(false)
    expect(validator('2020-02-30').isValid).toBe(false)
  })

  it('skips the not-before rule when notBefore is missing or invalid', () => {
    expect(dateValidator({}, message)('2020-01-01').isValid).toBe(true)
    expect(dateValidator({ notBefore: '' }, message)('2020-01-01').isValid).toBe(true)
  })
})

describe('coverFileValidator', () => {
  function file(type: string, size: number) {
    const value = new File(['x'], 'cover', { type })
    Object.defineProperty(value, 'size', { value: size })

    return value
  }

  it('accepts JPEG and PNG up to 5 MB', () => {
    expect(coverFileValidator(file('image/jpeg', 1024)).isValid).toBe(true)
    expect(coverFileValidator(file('image/png', COVER_FILE_MAX_BYTES)).isValid).toBe(true)
  })

  it('rejects other types and files over 5 MB', () => {
    expect(coverFileValidator(file('image/gif', 1024))).toEqual({
      isValid: false,
      errorMessage: 'Choose a .jpg or .png image up to 5 MB',
    })
    expect(coverFileValidator(file('application/pdf', 1024)).isValid).toBe(false)
    expect(coverFileValidator(file('image/png', 5 * 1024 * 1024 + 1)).isValid).toBe(false)
  })

  it('rejects a missing file', () => {
    expect(coverFileValidator(null).isValid).toBe(false)
  })

  it('translates the message', () => {
    i18n.global.locale.value = 'pt-BR'

    expect(coverFileValidator(null).errorMessage).toBe(
      'Selecione uma imagem .jpg ou .png de até 5 MB',
    )
  })
})

describe('translations', () => {
  it('follows the active locale', () => {
    i18n.global.locale.value = 'pt-BR'

    expect(blankValidator('').errorMessage).toBe('não pode ficar em branco')
  })
})
