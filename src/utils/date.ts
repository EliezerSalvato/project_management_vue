import type { AppLocale } from '@/locales/locale'

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE_REGEX.exec(value)
  if (!match) return null

  const [year, month, day] = match.slice(1).map(Number) as [number, number, number]
  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return date
}

export function todayIso(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatLongDate(value: string, locale: AppLocale): string {
  const date = parseIsoDate(value)
  if (!date) return value

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
