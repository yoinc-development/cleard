import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, test, vi} from 'vitest'
import {ColorPicker} from './ColorPicker'

describe('ColorPicker', () => {
    test('shows the current color in the swatch and the native input', () => {
        render(<ColorPicker value="#7c6fd6" onChange={() => {
        }} id="color"/>)

        expect(screen.getByText('#7c6fd6')).toBeInTheDocument()
        expect(screen.getByDisplayValue('#7c6fd6')).toBeInTheDocument()
    })

    test('picking a color calls onChange with the new hex value', () => {
        const onChange = vi.fn()
        render(<ColorPicker value="#7c6fd6" onChange={onChange} id="color"/>)

        fireEvent.change(screen.getByDisplayValue('#7c6fd6'), {target: {value: '#123456'}})

        expect(onChange).toHaveBeenCalledWith('#123456')
    })

    test('a legacy non-hex color falls back to the default in the native input', () => {
        render(<ColorPicker value="category-color-3" onChange={() => {
        }} id="color"/>)

        expect(screen.getByDisplayValue('#ff8000')).toBeInTheDocument()
    })
})
