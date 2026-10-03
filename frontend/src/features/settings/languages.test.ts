import {describe, expect, test} from 'vitest'
import {resolveLanguage} from './languages'

describe('resolveLanguage', () => {
    test('a stored language wins over the browser language', () => {
        expect(resolveLanguage('en', 'de-CH')).toBe('en')
    })

    test('uses the primary subtag of the browser language', () => {
        expect(resolveLanguage(null, 'de-CH')).toBe('de')
        expect(resolveLanguage(null, 'DE')).toBe('de')
    })

    test('falls back to English for unsupported or missing browser languages', () => {
        expect(resolveLanguage(null, 'fr-FR')).toBe('en')
        expect(resolveLanguage(null, '')).toBe('en')
    })
})
