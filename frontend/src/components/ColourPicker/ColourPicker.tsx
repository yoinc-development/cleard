import { CATEGORY_COLOURS, resolveCategoryColour } from '../../lib/colour'
import styles from './ColourPicker.module.css'

export interface ColourPickerProps {
  value: string
  onChange: (colour: string) => void
  id?: string
}

export function ColourPicker({ value, onChange, id }: ColourPickerProps) {
  // includes the colour of a category not pre-defined
  const options = CATEGORY_COLOURS.includes(value) ? CATEGORY_COLOURS : [value, ...CATEGORY_COLOURS]

  return (
    <div className={styles.root} id={id} role="radiogroup">
      {options.map((colour, index) => (
        <button
          key={colour}
          type="button"
          role="radio"
          aria-checked={colour === value}
          aria-label={`Colour ${index + 1}`}
          className={`${styles.swatch} ${colour === value ? styles.swatchActive : ''}`}
          style={{ background: resolveCategoryColour(colour) }}
          onClick={() => onChange(colour)}
        />
      ))}
    </div>
  )
}
