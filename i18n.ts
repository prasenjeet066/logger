import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(HttpBackend) // load translations via HTTP (public/locales)
  .use(LanguageDetector) // detect user language
  .use(initReactI18next) // bind react-i18next to i18next
  .init({
    fallbackLng: 'bn', // Changed to match next-i18next config
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    // Add supported languages to match next-i18next
    supportedLngs: ['en', 'bn'],
    // Ensure namespace is loaded
    defaultNS: 'lang',
    ns: ['lang']
  })

export default i18n
