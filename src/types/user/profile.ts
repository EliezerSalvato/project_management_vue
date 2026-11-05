import type { UserConfigs } from '@/types/user/user'

export type ProfileUpdatePayload = {
  firstName?: string
  lastName?: string
  configs?: UserConfigs
}

export type ProfileUpdatePayloadApi = {
  first_name?: string
  last_name?: string
  configs?: UserConfigs
}

export type NameForm = {
  firstName: string
  lastName: string
}
