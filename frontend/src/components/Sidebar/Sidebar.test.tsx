import {fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router'
import {beforeEach, describe, expect, test} from 'vitest'
import i18n from '../../i18n'
import {registerTestGerman} from '../../i18n/testing'
import {Sidebar} from './Sidebar'
import {SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH, SIDEBAR_WIDTH_STORAGE_KEY} from './sidebarWidth'

function renderSidebar() {
    return render(
        <MemoryRouter>
            <Sidebar/>
        </MemoryRouter>,
    )
}

describe('Sidebar', () => {
    registerTestGerman()

    test('links to every page', () => {
        renderSidebar()

        const links = screen.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])
        expect(links).toEqual([
            ['Overview', '/overview'],
            ['Transactions', '/transactions'],
            ['Categories', '/categories'],
            ['Thresholds', '/thresholds'],
            ['Settings', '/settings'],
        ])
    })

    test('has no section labels', () => {
        renderSidebar()

        expect(screen.queryByText('Month')).not.toBeInTheDocument()
        expect(screen.queryByText('Test')).not.toBeInTheDocument()
    })

    describe('resizing', () => {
        beforeEach(() => localStorage.clear())

        function pointer(type: string, clientX: number) {
            fireEvent(screen.getByRole('separator'), new MouseEvent(type, {bubbles: true, clientX}))
        }

        function drag(from: number, to: number) {
            pointer('pointerdown', from)
            pointer('pointermove', to)
            pointer('pointerup', to)
        }

        function sidebarWidth() {
            return screen.getByRole('navigation').parentElement!.style.width
        }

        test('starts at the minimum width', () => {
            renderSidebar()

            expect(sidebarWidth()).toBe(`${SIDEBAR_MIN_WIDTH}px`)
        })

        test('starts at the stored width', () => {
            localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '300')
            renderSidebar()

            expect(sidebarWidth()).toBe('300px')
        })

        test('follows the pointer while dragging and remembers the result', () => {
            renderSidebar()

            drag(260, 290)

            expect(sidebarWidth()).toBe('290px')
            expect(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)).toBe('290')
        })

        test('stops at the maximum width', () => {
            renderSidebar()

            drag(260, 900)

            expect(sidebarWidth()).toBe(`${SIDEBAR_MAX_WIDTH}px`)
            expect(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)).toBe(String(SIDEBAR_MAX_WIDTH))
        })

        test('stops at the minimum width', () => {
            localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '300')
            renderSidebar()

            drag(300, 0)

            expect(sidebarWidth()).toBe(`${SIDEBAR_MIN_WIDTH}px`)
        })

        test('ignores pointer movement when no drag started', () => {
            renderSidebar()

            pointer('pointermove', 300)

            expect(sidebarWidth()).toBe(`${SIDEBAR_MIN_WIDTH}px`)
        })
    })

    test('labels follow the active language', async () => {
        await i18n.changeLanguage('de')
        renderSidebar()

        expect(screen.getByRole('link', {name: 'Übersicht'})).toHaveAttribute('href', '/overview')
    })
})
