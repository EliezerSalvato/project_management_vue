import { getCookie } from '@/utils/cookies'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  applyDocumentLocale,
  ensureLocaleCookie,
  isAppLocale,
  resolveLocale,
  setLocaleCookie,
} from '@/locales/locale'

afterEach(() => {
  document.cookie = 'locale=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

describe('isAppLocale', () => {
  it('accepts supported locales', () => {
    expect(isAppLocale('en')).toBe(true)
    expect(isAppLocale('pt-BR')).toBe(true)
  })

  it.each(['fr', 'pt', 'EN', '', null, undefined])('rejects %j', (value) => {
    expect(isAppLocale(value)).toBe(false)
  })
})

describe('resolveLocale', () => {
  it('prefers the user locale', () => {
    setLocaleCookie('pt-BR')

    expect(resolveLocale('en')).toBe('en')
  })

  it('falls back to the cookie when the user locale is missing or invalid', () => {
    setLocaleCookie('en')

    expect(resolveLocale()).toBe('en')
    expect(resolveLocale('fr')).toBe('en')
  })

  it('ignores an invalid cookie value', () => {
    document.cookie = 'locale=fr; path=/'

    expect(resolveLocale()).toBe(DEFAULT_LOCALE)
  })

  it('falls back to the default locale', () => {
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE)
  })
})

describe('ensureLocaleCookie', () => {
  it('writes the given locale', () => {
    expect(ensureLocaleCookie('en')).toBe('en')
    expect(getCookie('locale')).toBe('en')
  })

  it('writes the default locale when no cookie exists', () => {
    expect(ensureLocaleCookie()).toBe(DEFAULT_LOCALE)
    expect(getCookie('locale')).toBe(DEFAULT_LOCALE)
  })
})

describe('applyDocumentLocale', () => {
  it('sets the html lang attribute', () => {
    applyDocumentLocale('en')

    expect(document.documentElement.lang).toBe('en')
  })
})
