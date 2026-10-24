import {afterEach, describe, expect, test, vi} from 'vitest'
import {
    clampSidebarWidth,
    readStoredSidebarWidth,
    SIDEBAR_MAX_WIDTH,
    SIDEBAR_MIN_WIDTH,
    SIDEBAR_WIDTH_STORAGE_KEY,
    storeSidebarWidth,
} from './sidebarWidth'

describe('clampSidebarWidth', () => {
    test.each([
        [0, SIDEBAR_MIN_WIDTH],
        [SIDEBAR_MIN_WIDTH - 1, SIDEBAR_MIN_WIDTH],
        [290, 290],
        [290.4, 290],
        [SIDEBAR_MAX_WIDTH + 1, SIDEBAR_MAX_WIDTH],
        [10_000, SIDEBAR_MAX_WIDTH],
        [Number.NaN, SIDEBAR_MIN_WIDTH],
        [Number.POSITIVE_INFINITY, SIDEBAR_MIN_WIDTH],
    ])('%s -> %s', (value, expected) => {
        expect(clampSidebarWidth(value)).toBe(expected)
    })
})

describe('readStoredSidebarWidth', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        localStorage.clear()
    })

    test('returns the stored width', () => {
        localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '300')

        expect(readStoredSidebarWidth()).toBe(300)
    })

    test('falls back to the minimum when nothing is stored', () => {
        expect(readStoredSidebarWidth()).toBe(SIDEBAR_MIN_WIDTH)
    })

    test.each([
        ['', SIDEBAR_MIN_WIDTH],
        ['wide', SIDEBAR_MIN_WIDTH],
        ['9999', SIDEBAR_MAX_WIDTH],
        ['10', SIDEBAR_MIN_WIDTH],
    ])('clamps the stored value %j', (value, expected) => {
        localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, value)

        expect(readStoredSidebarWidth()).toBe(expected)
    })

    test('falls back to the minimum when storage throws', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked')
        })

        expect(readStoredSidebarWidth()).toBe(SIDEBAR_MIN_WIDTH)
    })
})

describe('storeSidebarWidth', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        localStorage.clear()
    })

    test('round-trips through storage', () => {
        storeSidebarWidth(310)

        expect(readStoredSidebarWidth()).toBe(310)
    })

    test('ignores a storage failure', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked')
        })

        expect(() => storeSidebarWidth(310)).not.toThrow()
    })
})
