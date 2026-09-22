import {resolveCategoryColor, toHexColor} from '../../lib/color'
import styles from './ColorPicker.module.css'

export interface ColorPickerProps {
    value: string
    onChange: (color: string) => void
    id?: string
}

export function ColorPicker({value, onChange, id}: ColorPickerProps) {
    return (
        <div className={styles.root}>
            <label className={styles.swatch} style={{background: resolveCategoryColor(value)}}>
                <input
                    id={id}
                    type="color"
                    className={styles.input}
                    value={toHexColor(value)}
                    onChange={(event) => onChange(event.target.value)}
                />
            </label>
            <span className={styles.hex}>{toHexColor(value)}</span>
        </div>
    )
}
