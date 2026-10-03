import {describe, expect, test} from 'vitest'
import de from './de.json'
import en from './en.json'

function placeholders(text: string): string[] {
    return (text.match(/{{\s*\w+\s*}}/g) ?? []).map((p) => p.replace(/\s/g, '')).sort()
}

describe('translation catalogs', () => {
    test('de has exactly the keys of en', () => {
        expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort())
    })

    test('every translation keeps the placeholders of the English text', () => {
        for (const [key, text] of Object.entries(en)) {
            expect(placeholders((de as Record<string, string>)[key]), key).toEqual(placeholders(text))
        }
    })

    test('no English text is empty', () => {
        for (const [key, text] of Object.entries(en)) {
            expect(text.trim(), key).not.toBe('')
        }
    })
})
