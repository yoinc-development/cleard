export const SIDEBAR_MIN_WIDTH = 260

export const SIDEBAR_MAX_WIDTH = 320

export const SIDEBAR_WIDTH_STORAGE_KEY = 'cleard.sidebarWidth'

export function clampSidebarWidth(value: number): number {
    if (!Number.isFinite(value)) return SIDEBAR_MIN_WIDTH
    return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(value)))
}

export function readStoredSidebarWidth(): number {
    try {
        const stored = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)
        return stored === null ? SIDEBAR_MIN_WIDTH : clampSidebarWidth(Number(stored))
    } catch {
        return SIDEBAR_MIN_WIDTH
    }
}

export function storeSidebarWidth(width: number): void {
    try {
        localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width))
    } catch {
    }
}
