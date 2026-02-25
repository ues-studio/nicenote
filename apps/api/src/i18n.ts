export type ApiMessageKey = 'notFound' | 'internalServerError'

const EN_TRANSLATIONS: Record<ApiMessageKey, string> = {
  notFound: 'Not found',
  internalServerError: 'Internal Server Error',
}

const translations: Record<string, Record<ApiMessageKey, string>> = {
  en: EN_TRANSLATIONS,
  zh: {
    notFound: '未找到',
    internalServerError: '服务器内部错误',
  },
}

export function resolveLocale(acceptLanguage: string | undefined): string {
  if (!acceptLanguage) return 'en'
  const primary = acceptLanguage.split(',')[0]?.trim().split(';')[0]?.trim() ?? ''
  if (primary.startsWith('zh')) return 'zh'
  return 'en'
}

export function t(key: ApiMessageKey, locale: string): string {
  return translations[locale]?.[key] ?? EN_TRANSLATIONS[key]
}
