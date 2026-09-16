/** Switch between swatch token or raw CSS colour. I'm so smart for figuring that out. */
export function resolveCategoryColour(colour: string): string {
  return colour.startsWith('#') || colour.startsWith('rgb') ? colour : `var(--${colour})`
}
