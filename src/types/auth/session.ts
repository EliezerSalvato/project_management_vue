import type { JsonApiObjectResponse } from '@/types/api'
import type { User, UserResource } from '@/types/user'

export type SessionRefreshPayload = {
  rememberMe: boolean
}

export type SessionRefreshPayloadApi = {
  remember_me: boolean
}

export type AuthSessionSuccessResponseApi = JsonApiObjectResponse<{
  token: string
  user: UserResource
}>

export type AuthSessionSuccessResponse = {
  status: 'success'
  type: 'object'
  data: {
    token: string
    user: User
  }
}
