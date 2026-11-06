export const MAX_RECENT_SEARCHES = 5

export function readRecentSearches(storage: Storage, key: string): string[] {
  const raw = storage.getItem(key)
  if (raw === null) return []

  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) return []

    return value.slice(0, MAX_RECENT_SEARCHES)
  } catch {
    return []
  }
}

export function writeRecentSearches(storage: Storage, key: string, list: string[]): void {
  storage.setItem(key, JSON.stringify(list))
}

export function removeRecentSearch(list: string[], term: string): string[] {
  const lowered = term.toLowerCase()

  return list.filter((item) => item.toLowerCase() !== lowered)
}

export function addRecentSearch(
  list: string[],
  term: string,
  max: number = MAX_RECENT_SEARCHES,
): string[] {
  const trimmed = term.trim()
  if (trimmed === '') return list

  return [trimmed, ...removeRecentSearch(list, trimmed)].slice(0, max)
}
