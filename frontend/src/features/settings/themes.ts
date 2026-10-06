export const DEFAULT_THEME = 'dark'

export const THEME_IDS = ['dark', 'light', 'forest', 'sepia'] as const

export type ThemeId = (typeof THEME_IDS)[number]

export const THEME_STORAGE_KEY = 'cleard.theme'

export function resolveTheme(stored: string | null | undefined): ThemeId {
    return THEME_IDS.find((id) => id === stored) ?? DEFAULT_THEME
}

export function applyTheme(theme: ThemeId): void {
    const root = document.documentElement
    root.dataset.theme = theme
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
    }

    const shell = window.cleardShell
    if (!shell) return
    const styles = getComputedStyle(root)
    shell.setTheme({
        background: styles.getPropertyValue('--color-sidebar-bg').trim(),
        foreground: styles.getPropertyValue('--color-text-muted').trim(),
        colorScheme: styles.colorScheme.includes('light') ? 'light' : 'dark',
    })
}
