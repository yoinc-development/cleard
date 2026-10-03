import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import {DEFAULT_LANGUAGE, resolveLanguage} from '../features/settings/languages'
import de from './locales/de.json'
import en from './locales/en.json'

export const resources = {
    en: {translation: en},
    de: {translation: de},
} as const

void i18n.use(initReactI18next).init({
    resources,
    lng: resolveLanguage(null),
    fallbackLng: DEFAULT_LANGUAGE,
    returnEmptyString: false,
    keySeparator: false,
    interpolation: {escapeValue: false},
})

export default i18n
