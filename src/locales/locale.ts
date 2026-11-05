import { getCookie, setCookie } from '@/utils/cookies'

export const SUPPORTED_LOCALES = ['pt-BR', 'en'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'pt-BR'
export const LOCALE_COOKIE_NAME = 'locale'
export const LOCALE_COOKIE_EXPIRES = 'Fri, 31 Dec 9999 23:59:59 GMT'

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale)
}

export function resolveLocale(userLocale?: string | null): AppLocale {
  if (isAppLocale(userLocale)) return userLocale

  const cookieValue = getCookie(LOCALE_COOKIE_NAME)
  if (isAppLocale(cookieValue)) return cookieValue

  return DEFAULT_LOCALE
}

export function getLocaleFromCookie(): AppLocale {
  return resolveLocale()
}

export function setLocaleCookie(locale: AppLocale): void {
  setCookie(LOCALE_COOKIE_NAME, locale, LOCALE_COOKIE_EXPIRES)
}

export function ensureLocaleCookie(locale: AppLocale = getLocaleFromCookie()): AppLocale {
  setLocaleCookie(locale)

  return locale
}

export function applyDocumentLocale(locale: AppLocale): void {
  document.documentElement.lang = locale
}
