import { useCallback, useMemo } from 'react'
import { useSettings } from './useSettings'
import en from '../locales/en.json'
import tr from '../locales/tr.json'

type TranslationData = typeof en

const translations: Record<string, TranslationData> = {
  en,
  tr
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path
    }
  }

  return typeof current === 'string' ? current : path
}

export function useTranslation() {
  const { language } = useSettings()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = useCallback(
    (key: string, params?: any): string => {
      const translation = getNestedValue(translations[language] || translations.en, key)

      if (!params) {
        return translation
      }

      if (typeof params === 'string') {
        return translation
      }

      return Object.entries(params).reduce((str, [paramKey, value]) => {
        return str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value))
      }, translation)
    },
    [language]
  )

  const currentTranslations = useMemo(() => {
    return translations[language] || translations.en
  }, [language])

  return { t, language, translations: currentTranslations }
}
