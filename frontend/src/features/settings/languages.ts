import type {SelectOption} from '../../components/Select/Select'

export const DEFAULT_LANGUAGE = 'en'

export const LANGUAGE_OPTIONS: SelectOption[] = [
    {value: 'en', label: 'English'},
    {value: 'de', label: 'Deutsch'},
]

export function resolveLanguage(
    stored: string | null,
    browser: string = typeof navigator === 'undefined' ? '' : navigator.language,
): string {
    if (stored) return stored
    const primary = browser.split('-')[0].toLowerCase()
    return LANGUAGE_OPTIONS.some((o) => o.value === primary) ? primary : DEFAULT_LANGUAGE
}
