import { keysToCamelCase, keysToSnakeCase, toCamelKey } from '@/utils/case'
import { describe, expect, it } from 'vitest'

describe('toCamelKey', () => {
  it('converts snake_case keys to camelCase', () => {
    expect(toCamelKey('first_name')).toBe('firstName')
    expect(toCamelKey('password_confirmation_token')).toBe('passwordConfirmationToken')
  })

  it('keeps keys without underscores untouched', () => {
    expect(toCamelKey('email')).toBe('email')
    expect(toCamelKey('base')).toBe('base')
  })
})

describe('keysToCamelCase', () => {
  it('converts nested objects and arrays recursively', () => {
    const input = {
      first_name: 'Ada',
      user_configs: { preferred_locale: 'en' },
      related_items: [{ item_id: 1 }, { item_id: 2 }],
    }

    expect(keysToCamelCase(input)).toEqual({
      firstName: 'Ada',
      userConfigs: { preferredLocale: 'en' },
      relatedItems: [{ itemId: 1 }, { itemId: 2 }],
    })
  })

  it('returns primitives and null as is', () => {
    expect(keysToCamelCase('a_b')).toBe('a_b')
    expect(keysToCamelCase(42)).toBe(42)
    expect(keysToCamelCase(null)).toBeNull()
  })

  it('does not transform values, only keys', () => {
    expect(keysToCamelCase({ some_key: 'some_value' })).toEqual({ someKey: 'some_value' })
  })

  it('does not mutate the input', () => {
    const input = { first_name: 'Ada' }

    keysToCamelCase(input)

    expect(input).toEqual({ first_name: 'Ada' })
  })
})

describe('keysToSnakeCase', () => {
  it('converts nested objects and arrays recursively', () => {
    const input = {
      rememberMe: true,
      passwordConfirmation: 'secret',
      nestedValue: { innerKey: [{ deepKey: 1 }] },
    }

    expect(keysToSnakeCase(input)).toEqual({
      remember_me: true,
      password_confirmation: 'secret',
      nested_value: { inner_key: [{ deep_key: 1 }] },
    })
  })

  it('is the inverse of keysToCamelCase for snake_case input', () => {
    const api = { first_name: 'Ada', last_name: 'Lovelace', configs: { locale: 'en' } }

    expect(keysToSnakeCase(keysToCamelCase(api))).toEqual(api)
  })
})
