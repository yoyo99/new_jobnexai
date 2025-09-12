import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'de', 'es', 'it'],
    ns: ['common', 'translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        mode: 'cors',
        credentials: 'same-origin',
      },
    },
    react: {
      useSuspense: false,
    },
    debug: true,
  })

// Pour le debug : log la langue courante et les namespaces chargés
console.log('[i18n] Langue détectée:', i18n.language, '| Namespaces:', i18n.options.ns)


export default i18n