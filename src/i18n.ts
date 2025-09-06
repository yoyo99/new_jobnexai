import i18next, { i18n as I18nType } from 'i18next'
// Configure l'instance i18n via l'import side-effect unique
import './i18n.js'

// i18next est un singleton; on lui associe un type explicite pour TS
const i18n: I18nType = i18next
export default i18n
