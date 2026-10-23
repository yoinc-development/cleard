import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, expect, test, vi} from 'vitest'
import {TitleBar} from './TitleBar'

afterEach(() => {
    delete window.cleardShell
})

test('renders nothing in a plain browser', () => {
    const {container} = render(<TitleBar onOpenReleaseNotes={vi.fn()}/>)

    expect(container).toBeEmptyDOMElement()
})

test('renders the strip inside the desktop shell', () => {
    window.cleardShell = {platform: 'win32', setTheme: vi.fn()}

    const {container} = render(<TitleBar onOpenReleaseNotes={vi.fn()}/>)

    expect(container).not.toBeEmptyDOMElement()
})

test('the release notes button opens the release notes', async () => {
    window.cleardShell = {platform: 'darwin', setTheme: vi.fn()}
    const onOpenReleaseNotes = vi.fn()

    render(<TitleBar onOpenReleaseNotes={onOpenReleaseNotes}/>)
    await userEvent.click(screen.getByRole('button', {name: "What's new"}))

    expect(onOpenReleaseNotes).toHaveBeenCalledOnce()
})
