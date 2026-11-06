import {
  addRecentSearch,
  readRecentSearches,
  removeRecentSearch,
  writeRecentSearches,
} from '@/utils/recentSearches'
import { beforeEach, describe, expect, it } from 'vitest'

const key = 'projects.recentSearches.1'

beforeEach(() => {
  localStorage.clear()
})

describe('addRecentSearch', () => {
  it('puts the newest search first', () => {
    expect(addRecentSearch(['alfa'], 'beta')).toEqual(['beta', 'alfa'])
  })

  it('keeps at most 5 searches, dropping the oldest', () => {
    const list = ['e', 'd', 'c', 'b', 'a']

    expect(addRecentSearch(list, 'f')).toEqual(['f', 'e', 'd', 'c', 'b'])
  })

  it('moves a case-insensitive duplicate to the top', () => {
    expect(addRecentSearch(['beta', 'Alfa', 'gama'], 'ALFA')).toEqual(['ALFA', 'beta', 'gama'])
  })

  it('trims the term and ignores blank terms', () => {
    expect(addRecentSearch(['alfa'], '  beta  ')).toEqual(['beta', 'alfa'])
    expect(addRecentSearch(['alfa'], '   ')).toEqual(['alfa'])
  })

  it('does not mutate the given list', () => {
    const list = ['alfa']
    addRecentSearch(list, 'beta')

    expect(list).toEqual(['alfa'])
  })
})

describe('removeRecentSearch', () => {
  it('removes the term', () => {
    expect(removeRecentSearch(['beta', 'alfa'], 'alfa')).toEqual(['beta'])
  })

  it('keeps the list when the term is absent', () => {
    expect(removeRecentSearch(['beta'], 'gama')).toEqual(['beta'])
  })
})

describe('readRecentSearches', () => {
  it('reads a stored list of strings', () => {
    writeRecentSearches(localStorage, key, ['beta', 'alfa'])

    expect(localStorage.getItem(key)).toBe('["beta","alfa"]')
    expect(readRecentSearches(localStorage, key)).toEqual(['beta', 'alfa'])
  })

  it('returns at most 5 searches, newest first', () => {
    writeRecentSearches(localStorage, key, ['g', 'f', 'e', 'd', 'c', 'b', 'a'])

    expect(readRecentSearches(localStorage, key)).toEqual(['g', 'f', 'e', 'd', 'c'])
  })

  it('returns an empty list for missing or invalid data', () => {
    expect(readRecentSearches(localStorage, key)).toEqual([])

    for (const raw of ['{not json', '"alfa"', '{"a":1}', 'null', '["alfa",2]', '[null]']) {
      localStorage.setItem(key, raw)

      expect(() => readRecentSearches(localStorage, key)).not.toThrow()
      expect(readRecentSearches(localStorage, key)).toEqual([])
    }
  })
})
