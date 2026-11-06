import { formatLongDate, parseIsoDate, todayIso } from '@/utils/date'
import { describe, expect, it } from 'vitest'

describe('parseIsoDate', () => {
  it('parses YYYY-MM-DD as a local calendar date without a UTC shift', () => {
    const date = parseIsoDate('2024-09-01')

    expect(date?.getFullYear()).toBe(2024)
    expect(date?.getMonth()).toBe(8)
    expect(date?.getDate()).toBe(1)
    expect(date?.getHours()).toBe(0)
  })

  it.each(['2025-02-30', '2024-13-01', '2024-00-10', '2023-02-29'])(
    'returns null for the impossible date %s',
    (value) => {
      expect(parseIsoDate(value)).toBeNull()
    },
  )

  it('accepts a leap day', () => {
    expect(parseIsoDate('2024-02-29')?.getDate()).toBe(29)
  })

  it.each(['', '2024-9-1', '01/09/2024', '2024-09-01T00:00:00Z', 'abc'])(
    'returns null for the malformed value %j',
    (value) => {
      expect(parseIsoDate(value)).toBeNull()
    },
  )
})

describe('todayIso', () => {
  it('formats the given local date as YYYY-MM-DD', () => {
    expect(todayIso(new Date(2024, 0, 5, 23, 59))).toBe('2024-01-05')
  })

  it('defaults to the current date', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatLongDate', () => {
  it('formats pt-BR as 01 de setembro de 2024', () => {
    expect(formatLongDate('2024-09-01', 'pt-BR')).toBe('01 de setembro de 2024')
  })

  it('formats en as September 01, 2024', () => {
    expect(formatLongDate('2024-09-01', 'en')).toBe('September 01, 2024')
  })

  it('returns the original value when it is not a valid date', () => {
    expect(formatLongDate('2025-02-30', 'en')).toBe('2025-02-30')
  })
})
