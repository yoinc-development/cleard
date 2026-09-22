/** Switch between swatch token or raw CSS color. I'm so smart for figuring that out. */
export function resolveCategoryColor(color: string): string {
    return color.startsWith('#') || color.startsWith('rgb') ? color : `var(--${color})`
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i

/** The default color. The best color. */
export const DEFAULT_CATEGORY_COLOR = '#ff8000'

export function toHexColor(color: string): string {
    return HEX_COLOR.test(color) ? color : DEFAULT_CATEGORY_COLOR
}
