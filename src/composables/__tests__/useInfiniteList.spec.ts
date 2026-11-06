import type { Page } from '@/types/api/pagination'
import { useInfiniteList } from '@/composables/useInfiniteList'
import { describe, expect, it, vi } from 'vitest'

type Item = { id: string; name: string }

function makeItems(total: number): Item[] {
  return Array.from({ length: total }, (_, index) => ({ id: String(index + 1), name: `P${index + 1}` }))
}

// In-memory API with cursor pagination that, like the real one, rejects a deleted cursor.
function fakeApi(total: number, limit = 20) {
  const rows = makeItems(total)
  const fetchPage = vi.fn(async (after: string | undefined): Promise<Page<Item>> => {
    const offset = after === undefined ? 0 : rows.findIndex((row) => row.id === after) + 1
    if (offset === 0 && after !== undefined) throw new Error(`unknown cursor ${after}`)

    const items = rows.slice(offset, offset + limit)
    const next = offset + limit < rows.length ? items[items.length - 1]!.id : null

    return { items, pagination: { next, count: rows.length, limit } }
  })

  function destroy(id: string) {
    rows.splice(
      rows.findIndex((row) => row.id === id),
      1,
    )
  }

  return { fetchPage, destroy }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('useInfiniteList', () => {
  it('starts empty with more to load', () => {
    const list = useInfiniteList(fakeApi(3).fetchPage)

    expect(list.items.value).toEqual([])
    expect(list.count.value).toBeNull()
    expect(list.hasMore.value).toBe(true)
    expect(list.loading.value).toBe(false)
  })

  it('appends the next page after the loaded items', async () => {
    const api = fakeApi(45)
    const list = useInfiniteList(api.fetchPage)

    await list.loadMore()
    await list.loadMore()

    expect(api.fetchPage.mock.calls.map(([after]) => after)).toEqual([undefined, '20'])
    expect(list.items.value.map((item) => item.id)).toEqual(makeItems(40).map((item) => item.id))
    expect(list.count.value).toBe(45)
    expect(list.hasMore.value).toBe(true)
  })

  it('ignores loadMore while a page is loading', async () => {
    const pending = deferred<Page<Item>>()
    const fetchPage = vi.fn(() => pending.promise)
    const list = useInfiniteList(fetchPage)

    const first = list.loadMore()
    expect(list.loading.value).toBe(true)
    await list.loadMore()

    expect(fetchPage).toHaveBeenCalledTimes(1)

    pending.resolve({ items: makeItems(1), pagination: { next: null, count: 1, limit: 20 } })
    await first
    expect(list.loading.value).toBe(false)
  })

  it('makes no request after the last page', async () => {
    const api = fakeApi(25)
    const list = useInfiniteList(api.fetchPage)

    await list.loadMore()
    await list.loadMore()
    expect(list.items.value).toHaveLength(25)
    expect(list.hasMore.value).toBe(false)

    await list.loadMore()

    expect(api.fetchPage).toHaveBeenCalledTimes(2)
  })

  it('dedupes appended items by id', async () => {
    const fetchPage = vi.fn(async (after: string | undefined): Promise<Page<Item>> => ({
      items: after === undefined ? makeItems(2) : makeItems(3),
      pagination: { next: after === undefined ? '2' : null, count: 3, limit: 2 },
    }))
    const list = useInfiniteList(fetchPage)

    await list.loadMore()
    await list.loadMore()

    expect(list.items.value.map((item) => item.id)).toEqual(['1', '2', '3'])
  })

  it('does not skip an item after a removal', async () => {
    const api = fakeApi(45)
    const list = useInfiniteList(api.fetchPage)

    await list.loadMore()
    api.destroy('5')
    list.remove('5')

    while (list.hasMore.value) await list.loadMore()

    const expected = makeItems(45)
      .map((item) => item.id)
      .filter((id) => id !== '5')
    expect(list.items.value.map((item) => item.id)).toEqual(expected)
    expect(list.count.value).toBe(44)
  })

  it('continues after the previous item when the cursor item is removed', async () => {
    const api = fakeApi(45)
    const list = useInfiniteList(api.fetchPage)

    await list.loadMore()
    api.destroy('20')
    list.remove('20')
    await list.loadMore()

    expect(api.fetchPage).toHaveBeenLastCalledWith('19')
    expect(list.error.value).toBeNull()
    expect(list.items.value).toHaveLength(39)
  })

  it('remove drops the item and decrements count', async () => {
    const list = useInfiniteList(fakeApi(3).fetchPage)
    await list.loadMore()

    list.remove('2')

    expect(list.items.value.map((item) => item.id)).toEqual(['1', '3'])
    expect(list.count.value).toBe(2)

    list.remove('missing')
    expect(list.count.value).toBe(2)
  })

  it('replace swaps the item by id', async () => {
    const list = useInfiniteList(fakeApi(3).fetchPage)
    await list.loadMore()

    list.replace({ id: '2', name: 'Renamed' })

    expect(list.items.value.map((item) => item.name)).toEqual(['P1', 'Renamed', 'P3'])
  })

  it('reset clears the list and starts again from the first page', async () => {
    const api = fakeApi(45)
    const list = useInfiniteList(api.fetchPage)
    await list.loadMore()
    await list.loadMore()

    list.reset()
    expect(list.items.value).toEqual([])
    expect(list.count.value).toBeNull()
    expect(list.hasMore.value).toBe(true)

    await list.loadMore()

    expect(api.fetchPage).toHaveBeenLastCalledWith(undefined)
    expect(list.items.value).toHaveLength(20)
  })

  it('ignores a response that arrives after a reset', async () => {
    const pending = deferred<Page<Item>>()
    const list = useInfiniteList<Item>(vi.fn(() => pending.promise))

    const stale = list.loadMore()
    list.reset()
    pending.resolve({ items: makeItems(2), pagination: { next: null, count: 2, limit: 20 } })
    await stale

    expect(list.items.value).toEqual([])
    expect(list.loading.value).toBe(false)
  })

  it('exposes the error of a failed request and keeps the items', async () => {
    const failure = new Error('boom')
    const fetchPage = vi.fn(async (after: string | undefined): Promise<Page<Item>> => {
      if (after) throw failure

      return { items: makeItems(20), pagination: { next: '20', count: 45, limit: 20 } }
    })
    const list = useInfiniteList(fetchPage)

    await list.loadMore()
    await list.loadMore()

    expect(list.error.value).toBe(failure)
    expect(list.items.value).toHaveLength(20)
    expect(list.loading.value).toBe(false)
  })
})
