import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router'
import {describe, expect, test} from 'vitest'
import i18n from '../../i18n'
import {registerTestGerman} from '../../i18n/testing'
import {Sidebar} from './Sidebar'

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

    test('labels follow the active language', async () => {
        await i18n.changeLanguage('de')
        renderSidebar()

        expect(screen.getByRole('link', {name: 'Übersicht'})).toHaveAttribute('href', '/overview')
    })
})
