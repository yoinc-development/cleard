/** Switch between swatch token or raw CSS color. I'm so smart for figuring that out. */
export function resolveCategoryColor(color: string): string {
  return color.startsWith('#') || color.startsWith('rgb') ? color : `var(--${color})`
}

/**
 * Same as the category color scale in tokens.css (should be replaced eventually with a
 * custom color picker...
 */
export const CATEGORY_COLORS = ['#8b7cf6', '#a394fb', '#7c6fd6', '#9a9cc2', '#6b6d7d', '#4c4e5c']
