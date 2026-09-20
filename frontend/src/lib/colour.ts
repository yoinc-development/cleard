/** Switch between swatch token or raw CSS colour. I'm so smart for figuring that out. */
export function resolveCategoryColour(colour: string): string {
  return colour.startsWith('#') || colour.startsWith('rgb') ? colour : `var(--${colour})`
}

/**
 * Same as the category colour scale in tokens.css (should be replaced eventually with a
 * custom colour picker...
 */
export const CATEGORY_COLOURS = ['#8b7cf6', '#a394fb', '#7c6fd6', '#9a9cc2', '#6b6d7d', '#4c4e5c']
