import { getCookie, setCookie } from '@/utils/cookies'
import { afterEach, describe, expect, it } from 'vitest'

const PAST = 'Thu, 01 Jan 1970 00:00:00 GMT'
const FUTURE = 'Fri, 31 Dec 9999 23:59:59 GMT'

afterEach(() => {
  document.cookie.split('; ').forEach((entry) => {
    const [name] = entry.split('=')
    if (name) document.cookie = `${name}=; expires=${PAST}; path=/`
  })
})

describe('cookies', () => {
  it('returns null for a missing cookie', () => {
    expect(getCookie('missing')).toBeNull()
  })

  it('sets and reads a cookie', () => {
    setCookie('locale', 'pt-BR', FUTURE)

    expect(getCookie('locale')).toBe('pt-BR')
  })

  it('encodes and decodes special characters', () => {
    setCookie('note', 'a b;c=d', FUTURE)

    expect(getCookie('note')).toBe('a b;c=d')
  })

  it('does not match cookies that share a prefix', () => {
    setCookie('localeOverride', 'en', FUTURE)

    expect(getCookie('locale')).toBeNull()
  })
})
