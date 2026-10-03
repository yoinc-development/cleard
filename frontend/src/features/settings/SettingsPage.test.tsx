import {render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter, Route, Routes} from 'react-router'
import {describe, expect, test, vi} from 'vitest'
import {ApiProvider} from '../../api/ApiProvider'
import type {TransactionsApi} from '../../api/TransactionsApi'
import type {VersionInfo} from '../../api/types'
import {SettingsProvider} from '../../state/SettingsProvider'
import {SettingsPage} from './SettingsPage'

const DEV_BUILD: VersionInfo = {current: null, latest: null, updateAvailable: false, releaseUrl: null}

function stubApi(overrides: Partial<TransactionsApi> = {}): TransactionsApi {
    return {
        listTransactions: () => Promise.resolve({transactions: [], filteredCount: 0}),
        createTransaction: () => Promise.reject(new Error('not implemented')),
        updateTransaction: () => Promise.reject(new Error('not implemented')),
        deleteTransaction: () => Promise.reject(new Error('not implemented')),
        listCategories: () => Promise.resolve([]),
        createCategory: () => Promise.reject(new Error('not implemented')),
        updateCategory: () => Promise.reject(new Error('not implemented')),
        listCategoryTransactions: () => Promise.resolve([]),
        deleteCategory: () => Promise.resolve(),
        listTags: () => Promise.resolve([]),
        getMonthSummary: () => Promise.reject(new Error('not implemented')),
        getDailySpend: () => Promise.resolve([]),
        getSettings: () => Promise.resolve({currency: 'CHF', locale: null}),
        updateSettings: (body) => Promise.resolve({currency: 'CHF', locale: null, ...body}),
        clearAllData: () => Promise.resolve(),
        getVersionInfo: () => Promise.resolve(DEV_BUILD),
        ...overrides,
    }
}

function renderPage(api: TransactionsApi) {
    return render(
        <ApiProvider api={api}>
            <SettingsProvider>
                <MemoryRouter initialEntries={['/settings']}>
                    <Routes>
                        <Route path="/settings" element={<SettingsPage/>}/>
                        <Route path="/overview" element={<p>Overview page</p>}/>
                    </Routes>
                </MemoryRouter>
            </SettingsProvider>
        </ApiProvider>,
    )
}

describe('SettingsPage language', () => {
    test('saving a language sends the locale and reloads the settings', async () => {
        const user = userEvent.setup()
        const getSettings = vi
            .fn()
            .mockResolvedValueOnce({currency: 'CHF', locale: null})
            .mockResolvedValue({currency: 'CHF', locale: 'de'})
        const updateSettings = vi.fn().mockResolvedValue({currency: 'CHF', locale: 'de'})
        renderPage(stubApi({getSettings, updateSettings}))

        const save = screen.getByRole('button', {name: 'Save language'})
        expect(save).toBeDisabled()

        await user.click(screen.getByRole('button', {name: /System default/}))
        await user.click(screen.getByRole('option', {name: 'Deutsch'}))
        await user.click(save)

        await waitFor(() => expect(updateSettings).toHaveBeenCalledWith({locale: 'de'}))
        await waitFor(() => expect(getSettings).toHaveBeenCalledTimes(2))
        await waitFor(() => expect(screen.getByRole('button', {name: 'Save language'})).toBeDisabled())
    })

    test('choosing the system default sends an empty locale', async () => {
        const user = userEvent.setup()
        const updateSettings = vi.fn().mockResolvedValue({currency: 'CHF', locale: null})
        renderPage(stubApi({
            getSettings: () => Promise.resolve({currency: 'CHF', locale: 'de'}),
            updateSettings,
        }))

        await user.click(await screen.findByRole('button', {name: 'Deutsch'}))
        await user.click(screen.getByRole('option', {name: /System default/}))
        await user.click(screen.getByRole('button', {name: 'Save language'}))

        await waitFor(() => expect(updateSettings).toHaveBeenCalledWith({locale: ''}))
    })

    test('a failed language change shows an error', async () => {
        const user = userEvent.setup()
        renderPage(stubApi({updateSettings: () => Promise.reject(new Error('boom'))}))

        await user.click(screen.getByRole('button', {name: /System default/}))
        await user.click(screen.getByRole('option', {name: 'Deutsch'}))
        await user.click(screen.getByRole('button', {name: 'Save language'}))

        expect(await screen.findByText(/could not change the language/i)).toBeInTheDocument()
    })
})

describe('SettingsPage currency', () => {
    test('saving a new currency asks for confirmation, then updates and reloads the settings', async () => {
        const user = userEvent.setup()
        const getSettings = vi
            .fn()
            .mockResolvedValueOnce({currency: 'CHF', locale: null})
            .mockResolvedValue({currency: 'EUR', locale: null})
        const updateSettings = vi.fn().mockResolvedValue({currency: 'EUR', locale: null})
        renderPage(stubApi({getSettings, updateSettings}))

        const save = screen.getByRole('button', {name: 'Save currency'})
        expect(save).toBeDisabled()

        await user.click(screen.getByRole('button', {name: /CHF/}))
        await user.click(screen.getByRole('option', {name: /EUR/}))
        await user.click(save)

        expect(updateSettings).not.toHaveBeenCalled()
        const dialog = await screen.findByRole('dialog')
        await user.click(within(dialog).getByRole('button', {name: 'Change currency'}))

        await waitFor(() => expect(updateSettings).toHaveBeenCalledWith({currency: 'EUR'}))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(getSettings).toHaveBeenCalledTimes(2)
        expect(screen.getByRole('button', {name: 'Save currency'})).toBeDisabled()
    })

    test('a failed currency change keeps the dialog open with an error', async () => {
        const user = userEvent.setup()
        renderPage(stubApi({updateSettings: () => Promise.reject(new Error('boom'))}))

        await user.click(screen.getByRole('button', {name: /CHF/}))
        await user.click(screen.getByRole('option', {name: /EUR/}))
        await user.click(screen.getByRole('button', {name: 'Save currency'}))
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', {name: 'Change currency'}))

        expect(await screen.findByText(/could not change the currency/i)).toBeInTheDocument()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
})

describe('SettingsPage currency reload failure', () => {
    test('keeps the dialog open with an error when the settings cannot be reloaded after saving', async () => {
        const user = userEvent.setup()
        const getSettings = vi
            .fn()
            .mockResolvedValueOnce({currency: 'CHF', locale: null})
            .mockRejectedValue(new Error('boom'))
        renderPage(stubApi({getSettings}))

        await user.click(screen.getByRole('button', {name: /CHF/}))
        await user.click(screen.getByRole('option', {name: /EUR/}))
        await user.click(screen.getByRole('button', {name: 'Save currency'}))
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', {name: 'Change currency'}))

        expect(await screen.findByText(/could not change the currency/i)).toBeInTheDocument()
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
})

describe('SettingsPage clear all data', () => {
    test('deletes nothing until confirmed, then shows the overview page', async () => {
        const user = userEvent.setup()
        const clearAllData = vi.fn().mockResolvedValue(undefined)
        renderPage(stubApi({clearAllData}))

        await user.click(screen.getByRole('button', {name: 'Clear all data'}))
        const dialog = await screen.findByRole('dialog')
        expect(clearAllData).not.toHaveBeenCalled()
        expect(screen.queryByText('Overview page')).not.toBeInTheDocument()

        await user.click(within(dialog).getByRole('button', {name: 'Delete all data'}))

        expect(await screen.findByText('Overview page')).toBeInTheDocument()
        expect(clearAllData).toHaveBeenCalledOnce()
    })

    test('cancelling keeps the data and stays on the settings page', async () => {
        const user = userEvent.setup()
        const clearAllData = vi.fn()
        renderPage(stubApi({clearAllData}))

        await user.click(screen.getByRole('button', {name: 'Clear all data'}))
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', {name: 'Cancel'}))

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(clearAllData).not.toHaveBeenCalled()
        expect(screen.getByRole('heading', {name: 'Settings'})).toBeInTheDocument()
    })

    test('a failed delete stays on settings with the error shown', async () => {
        const user = userEvent.setup()
        renderPage(stubApi({clearAllData: () => Promise.reject(new Error('boom'))}))

        await user.click(screen.getByRole('button', {name: 'Clear all data'}))
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', {name: 'Delete all data'}))

        expect(await screen.findByText(/could not delete the data/i)).toBeInTheDocument()
        expect(screen.queryByText('Overview page')).not.toBeInTheDocument()
    })
})

describe('SettingsPage version', () => {
    test('shows a development build without an update check', async () => {
        renderPage(stubApi())

        expect(await screen.findByText('Development build')).toBeInTheDocument()
        expect(screen.queryByText(/update available/i)).not.toBeInTheDocument()
    })

    test('links to the release page when an update is available', async () => {
        const info: VersionInfo = {
            current: '1.0.0',
            latest: '1.1.0',
            updateAvailable: true,
            releaseUrl: 'https://github.com/yoinc-development/cleard/releases/tag/v1.1.0',
        }
        renderPage(stubApi({getVersionInfo: () => Promise.resolve(info)}))

        expect(await screen.findByText('Version 1.0.0')).toBeInTheDocument()
        expect(screen.getByText(/update available: 1\.1\.0/i)).toBeInTheDocument()
        expect(screen.getByRole('link', {name: 'View release'})).toHaveAttribute('href', info.releaseUrl)
    })

    test('says so when the installed version is current', async () => {
        const info: VersionInfo = {current: '1.1.0', latest: '1.1.0', updateAvailable: false, releaseUrl: null}
        renderPage(stubApi({getVersionInfo: () => Promise.resolve(info)}))

        expect(await screen.findByText('You are up to date.')).toBeInTheDocument()
    })

    test('says so when the latest version could not be determined', async () => {
        const info: VersionInfo = {current: '1.0.0', latest: null, updateAvailable: false, releaseUrl: null}
        renderPage(stubApi({getVersionInfo: () => Promise.resolve(info)}))

        expect(await screen.findByText('Could not check for updates.')).toBeInTheDocument()
    })

    test('copes with the endpoint failing', async () => {
        renderPage(stubApi({getVersionInfo: () => Promise.reject(new Error('boom'))}))

        expect(await screen.findByText('Version information is unavailable.')).toBeInTheDocument()
    })
})
