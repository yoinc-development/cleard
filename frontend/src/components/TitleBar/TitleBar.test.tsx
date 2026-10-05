import {render} from '@testing-library/react'
import {afterEach, expect, test, vi} from 'vitest'
import {TitleBar} from './TitleBar'

afterEach(() => {
    delete window.cleardShell
})

test('renders nothing in a plain browser', () => {
    const {container} = render(<TitleBar/>)

    expect(container).toBeEmptyDOMElement()
})

test('renders the strip inside the desktop shell', () => {
    window.cleardShell = {platform: 'win32', setTheme: vi.fn()}

    const {container} = render(<TitleBar/>)

    expect(container).not.toBeEmptyDOMElement()
})
