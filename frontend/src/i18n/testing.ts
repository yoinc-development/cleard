import {afterEach, beforeEach} from 'vitest'
import i18n from './index'
import de from './locales/de.json'

const TEST_GERMAN = {
    'settings.title': 'Einstellungen',
    'settings.language.save': 'Sprache speichern',
    'settings.language.system_default': 'Systemstandard ({{language}})',
    'date.day.friday': 'Freitag',
    'date.month.september': 'September',
    'date.month_short.sep': 'Sept.',
    'overview.vs_previous': '{{amount}} gegenüber {{month}}',
    'thresholds.month_complete': 'Monat abgeschlossen',
    'date.day_heading': '{{day}}, {{date}}. {{month}}',
    'date.month_label': '{{month}} {{year}}',
    'date.month_label_short': '{{month}} {{year}}',
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
