import {describe, expect, test} from 'vitest'
import {CHANGELOG, CHANGELOG_SECTION_TYPES, entryForVersion, findEntry} from './changelog'

function compareVersions(a: string, b: string): number {
    const left = a.split('.').map(Number)
    const right = b.split('.').map(Number)
    for (let i = 0; i < Math.max(left.length, right.length); i++) {
        const diff = (left[i] ?? 0) - (right[i] ?? 0)
        if (diff !== 0) return diff
    }
    return 0
}

describe('changelog.json', () => {
    test('versions are unique and sorted newest first', () => {
        const versions = CHANGELOG.map((entry) => entry.version)
        expect(new Set(versions).size).toBe(versions.length)
        expect([...versions].sort((a, b) => compareVersions(b, a))).toEqual(versions)
    })

    test('every entry has a version, an ISO date and at least one section', () => {
        for (const entry of CHANGELOG) {
            expect(entry.version, entry.version).toMatch(/^\d+\.\d+\.\d+$/)
            expect(entry.date, entry.version).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            expect(entry.sections.length, entry.version).toBeGreaterThan(0)
        }
    })

    test('every section has a known type and the same non-empty items in en and de', () => {
        for (const entry of CHANGELOG) {
            for (const section of entry.sections) {
                const label = `${entry.version} ${section.type}`
                expect(CHANGELOG_SECTION_TYPES, label).toContain(section.type)
                expect(Object.keys(section.items).sort(), label).toEqual(['de', 'en'])
                expect(section.items.en.length, label).toBeGreaterThan(0)
                expect(section.items.de.length, label).toBe(section.items.en.length)
                for (const item of [...section.items.en, ...section.items.de]) {
                    expect(item.trim(), label).not.toBe('')
                }
            }
        }
    })
})

describe('entry lookup', () => {
    test('entryForVersion only matches the exact version', () => {
        expect(entryForVersion(CHANGELOG[0].version)).toBe(CHANGELOG[0])
        expect(entryForVersion('0.0.1')).toBeUndefined()
        expect(entryForVersion(null)).toBeUndefined()
    })

    test('findEntry falls back to the newest entry', () => {
        expect(findEntry('0.0.1')).toBe(CHANGELOG[0])
        expect(findEntry(null)).toBe(CHANGELOG[0])
    })
})
