export type PaginationApi = {
  next: string | null
  count: number
  limit: number
}

export type Page<T> = {
  items: T[]
  pagination: PaginationApi
}
