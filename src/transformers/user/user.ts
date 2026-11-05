import type { User, UserConfigs, UserResource } from '@/types/user'
import { keysToCamelCase } from '@/utils/case'

type UserAttributes = Omit<User, 'id' | 'fullName' | 'configs'> & { configs?: UserConfigs }

export function buildFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim()
}

export function userFromResource(resource: UserResource): User {
  const { id, attributes } = resource.data
  const user = keysToCamelCase<UserAttributes>(attributes)

  return {
    ...user,
    id,
    configs: user.configs ?? {},
    fullName: buildFullName(user.firstName, user.lastName),
  }
}
