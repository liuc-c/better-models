import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zh from './locales/zh.json'

const resources = {
  en: { translation: en },
  zh: { translation: zh },
}

function getInitialLanguage(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('language')
    if (stored && (stored === 'en' || stored === 'zh')) {
      return stored
    }
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('zh')) {
      return 'zh'
    }
  }
  return 'en'
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
