import { safeRedirectPath } from '@/utils/safeRedirect'
import { describe, expect, it } from 'vitest'

describe('safeRedirectPath', () => {
  it.each(['/', '/users/profile', '/projects?page=2#top'])('accepts internal path %s', (path) => {
    expect(safeRedirectPath(path)).toBe(path)
  })

  it.each([
    ['protocol-relative URL', '//evil.com'],
    ['absolute URL', 'https://evil.com'],
    ['javascript URL', 'javascript:alert(1)'],
    ['relative path', 'users/profile'],
    ['backslash trick', '/\\evil.com'],
    ['empty string', ''],
  ])('rejects %s', (_, path) => {
    expect(safeRedirectPath(path)).toBe('/')
  })

  it.each([undefined, null, 42, ['/a']])('rejects non-string value %j', (value) => {
    expect(safeRedirectPath(value)).toBe('/')
  })

  it('uses the given fallback', () => {
    expect(safeRedirectPath('//evil.com', '/home')).toBe('/home')
  })
})
