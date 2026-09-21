import { CATEGORY_COLORS, resolveCategoryColor } from '../../lib/color'
import styles from './ColorPicker.module.css'

export interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  id?: string
}

export function ColorPicker({ value, onChange, id }: ColorPickerProps) {
  // includes the color of a category not pre-defined
  const options = CATEGORY_COLORS.includes(value) ? CATEGORY_COLORS : [value, ...CATEGORY_COLORS]

  return (
    <div className={styles.root} id={id} role="radiogroup">
      {options.map((color, index) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={color === value}
          aria-label={`Color ${index + 1}`}
          className={`${styles.swatch} ${color === value ? styles.swatchActive : ''}`}
          style={{ background: resolveCategoryColor(color) }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  )
}
