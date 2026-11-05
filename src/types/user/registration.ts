import type { JsonApiCreateResponse } from '@/types/api'
import type { UserResource } from '@/types/user/user'

export type RegistrationPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirmation: string
}

export type RegistrationPayloadApi = {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
}

export type RegistrationSuccessResponseApi = JsonApiCreateResponse<{ user: UserResource }>

export type RegistrationForm = RegistrationPayload
