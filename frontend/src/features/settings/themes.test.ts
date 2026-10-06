import {afterEach, describe, expect, test, vi} from 'vitest'
import {applyTheme, resolveTheme, THEME_STORAGE_KEY} from './themes'

describe('resolveTheme', () => {
    test('keeps a known theme', () => {
        expect(resolveTheme('sepia')).toBe('sepia')
    })

    test.each([null, undefined, '', 'neon'])('falls back to dark for %s', (value) => {
        expect(resolveTheme(value)).toBe('dark')
    })
})

describe('applyTheme', () => {
    afterEach(() => {
        delete window.cleardShell
        delete document.documentElement.dataset.theme
        localStorage.clear()
    })

    test('sets data-theme and caches the choice', () => {
        applyTheme('forest')

        expect(document.documentElement.dataset.theme).toBe('forest')
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('forest')
    })

    test('tells the desktop shell when it is present', () => {
        const setTheme = vi.fn()
        window.cleardShell = {platform: 'win32', setTheme}
        document.documentElement.style.setProperty('--color-sidebar-bg', ' #f4f5f9 ')
        document.documentElement.style.setProperty('--color-text-muted', '#55586a')

        applyTheme('light')

        expect(setTheme).toHaveBeenCalledWith(expect.objectContaining({background: '#f4f5f9', foreground: '#55586a'}))
        document.documentElement.removeAttribute('style')
    })
})
