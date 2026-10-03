import {afterEach, beforeEach} from 'vitest'
import i18n from './index'
import de from './locales/de.json'

const TEST_GERMAN = {
    'settings.title': 'Einstellungen',
    'settings.language.save': 'Sprache speichern',
    'settings.language.system_default': 'Systemstandard ({{language}})',
}

export function registerTestGerman() {
    beforeEach(() => {
        i18n.addResourceBundle('de', 'translation', TEST_GERMAN, true, true)
    })
    afterEach(async () => {
        await i18n.changeLanguage('en')
        i18n.addResourceBundle('de', 'translation', de, true, true)
    })
}
