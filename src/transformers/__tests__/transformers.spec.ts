import type { AuthSessionSuccessResponseApi } from '@/types/auth'
import type { UserResource } from '@/types/user'
import { authenticationTransformer, sessionRefreshTransformer } from '@/transformers/auth'
import { describe, expect, it } from 'vitest'
import {
  buildFullName,
  passwordChangeTransformer,
  profileTransformer,
  registrationTransformer,
  userFromResource,
} from '@/transformers/user'

function buildUserResource(attributes: Partial<UserResource['data']['attributes']> = {}) {
  return {
    data: {
      id: '7',
      type: 'user',
      attributes: {
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
        ...attributes,
      },
    },
  } satisfies UserResource
}

describe('buildFullName', () => {
  it('joins first and last names', () => {
    expect(buildFullName('Ada', 'Lovelace')).toBe('Ada Lovelace')
  })

  it('trims when a part is missing', () => {
    expect(buildFullName('Ada', '')).toBe('Ada')
    expect(buildFullName('', 'Lovelace')).toBe('Lovelace')
  })
})

describe('userFromResource', () => {
  it('maps a JSON:API user resource to the domain user', () => {
    expect(userFromResource(buildUserResource({ configs: { locale: 'en' } }))).toEqual({
      id: '7',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      configs: { locale: 'en' },
    })
  })

  it('defaults configs to an empty object', () => {
    expect(userFromResource(buildUserResource()).configs).toEqual({})
  })
})

describe('authentication transformers', () => {
  it('serializes the login payload to snake_case', () => {
    expect(
      authenticationTransformer.toApi({ email: 'a@b.co', password: 'secret', rememberMe: true }),
    ).toEqual({ email: 'a@b.co', password: 'secret', remember_me: true })
  })

  it('serializes the session refresh payload', () => {
    expect(sessionRefreshTransformer.toApi({ rememberMe: false })).toEqual({ remember_me: false })
  })

  it('maps the session response with token and user', () => {
    const response: AuthSessionSuccessResponseApi = {
      status: 'success',
      type: 'object',
      data: { token: 'jwt', user: buildUserResource() },
    }

    const result = authenticationTransformer.fromApi(response)

    expect(result.data.token).toBe('jwt')
    expect(result.data.user.fullName).toBe('Ada Lovelace')
    expect(result).not.toHaveProperty('data.user.first_name')
  })
})

describe('user payload transformers', () => {
  it('serializes registration payload', () => {
    expect(
      registrationTransformer.toApi({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'secret123',
        passwordConfirmation: 'secret123',
      }),
    ).toMatchObject({ first_name: 'Ada', last_name: 'Lovelace', password_confirmation: 'secret123' })
  })

  it('serializes password change payload', () => {
    expect(
      passwordChangeTransformer.toApi({
        currentPassword: 'old',
        password: 'new',
        passwordConfirmation: 'new',
      }),
    ).toEqual({ current_password: 'old', password: 'new', password_confirmation: 'new' })
  })

  describe('profileTransformer', () => {
    it('serializes only the provided fields', () => {
      expect(profileTransformer.toApi({ firstName: 'Ada' })).toEqual({ first_name: 'Ada' })
      expect(profileTransformer.toApi({ configs: { locale: 'en' } })).toEqual({
        configs: { locale: 'en' },
      })
    })

    it('keeps empty strings (explicit clears)', () => {
      expect(profileTransformer.toApi({ lastName: '' })).toEqual({ last_name: '' })
    })

    it('serializes all fields', () => {
      expect(
        profileTransformer.toApi({ firstName: 'Ada', lastName: 'L', configs: { locale: 'pt-BR' } }),
      ).toEqual({ first_name: 'Ada', last_name: 'L', configs: { locale: 'pt-BR' } })
    })
  })
})
