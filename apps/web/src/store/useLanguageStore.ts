import { create } from 'zustand'

import { i18n } from '@nicenote/app-shell'

type Language = 'en' | 'zh'

const LANG_STORAGE_KEY = 'nicenote-lang'

interface LanguageStore {
  language: Language
  setLanguage: (lang: Language) => void
}

function resolveInitialLanguage(): Language {
  const lang = i18n.language
  return lang === 'zh' ? 'zh' : 'en'
}

function applyLanguage(lang: Language) {
  void i18n.changeLanguage(lang)
  localStorage.setItem(LANG_STORAGE_KEY, lang)
  document.documentElement.lang = lang
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: resolveInitialLanguage(),
  setLanguage: (lang) => {
    applyLanguage(lang)
    set({ language: lang })
  },
}))
