import type { User } from '@/types/user'
import { useUserStore } from '@/stores/user'
import { createPinia, setActivePinia } from 'pinia'
import { useRecentSearches } from '@/composables/useRecentSearches'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

const user: User = {
  id: '42',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  fullName: 'Ada Lovelace',
  configs: { locale: 'pt-BR' },
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('useRecentSearches', () => {
  it('stores searches under a key with the user id', () => {
    useUserStore().setUser(user)
    const { add } = useRecentSearches()

    add('alfa')

    expect(JSON.parse(localStorage.getItem('projects.recentSearches.42')!)).toEqual(['alfa'])
  })

  it('loads the stored searches of the signed-in user', () => {
    localStorage.setItem('projects.recentSearches.42', '["beta","alfa"]')
    localStorage.setItem('projects.recentSearches.7', '["outro"]')
    useUserStore().setUser(user)

    expect(useRecentSearches().searches.value).toEqual(['beta', 'alfa'])
  })

  it('persists add and remove to localStorage', () => {
    useUserStore().setUser(user)
    const { searches, add, remove } = useRecentSearches()

    add('alfa')
    add('beta')
    expect(searches.value).toEqual(['beta', 'alfa'])

    remove('alfa')
    expect(searches.value).toEqual(['beta'])
    expect(localStorage.getItem('projects.recentSearches.42')).toBe('["beta"]')
  })

  it('reloads when the user changes', async () => {
    localStorage.setItem('projects.recentSearches.7', '["outro"]')
    const store = useUserStore()
    store.setUser(user)
    const { searches } = useRecentSearches()

    store.setUser({ ...user, id: '7' })
    await nextTick()

    expect(searches.value).toEqual(['outro'])
  })

  it('keeps nothing in storage without a signed-in user', () => {
    const { searches, add } = useRecentSearches()

    add('alfa')

    expect(searches.value).toEqual(['alfa'])
    expect(localStorage.length).toBe(0)
  })
})
