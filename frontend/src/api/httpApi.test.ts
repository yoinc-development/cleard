import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'
import {httpApi} from './httpApi'

describe('httpApi.listTransactions', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: string) => {
                expect(input).toContain('/api/transactions?')
                return new Response(
                    JSON.stringify({
                        transactions: [
                            {
                                id: 1,
                                date: '2026-09-25',
                                amount: -48.9,
                                currency: 'CHF',
                                description: 'Migros',
                                categoryId: '2',
                                tags: ['weekly'],
                            },
                        ],
                        filteredCount: 1,
                    }),
                    {status: 200, headers: {'Content-Type': 'application/json'}},
                )
            }),
        )
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    test('maps the real backend response onto the frontend Transaction shape', async () => {
        const page = await httpApi.listTransactions({month: '2026-09', limit: 20, offset: 0})

        expect(page.filteredCount).toBe(1)
        expect(page.transactions).toEqual([
            {
                id: '1',
                date: '2026-09-25',
                amount: -48.9,
                currency: 'CHF',
                description: 'Migros',
                categoryId: '2',
                tags: ['weekly'],
            },
        ])
    })

    test('builds the query string from the query object', async () => {
        const fetchMock = vi.mocked(fetch)
        await httpApi.listTransactions({
            month: '2026-09',
            categoryIds: ['groceries', 'eating-out'],
            tags: ['weekly'],
            q: 'coop',
            limit: 15,
            offset: 30,
        })

        const requestedUrl = fetchMock.mock.calls[0][0] as string
        expect(requestedUrl).toContain('month=2026-09')
        expect(requestedUrl).toContain('categoryIds=groceries%2Ceating-out')
        expect(requestedUrl).toContain('tags=weekly')
        expect(requestedUrl).toContain('q=coop')
        expect(requestedUrl).toContain('limit=15')
        expect(requestedUrl).toContain('offset=30')
    })
})

describe('httpApi.getDailySpend', () => {
    test('fetches the daily spend series for the month', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: string) => {
                expect(input).toContain('/api/transactions/daily-spend?month=2026-09')
                return new Response(
                    JSON.stringify([
                        {date: '2026-09-01', totalOut: 12.5},
                        {date: '2026-09-02', totalOut: 0},
                    ]),
                    {status: 200, headers: {'Content-Type': 'application/json'}},
                )
            }),
        )

        const result = await httpApi.getDailySpend('2026-09')

        expect(result).toEqual([
            {date: '2026-09-01', totalOut: 12.5},
            {date: '2026-09-02', totalOut: 0},
        ])

        vi.unstubAllGlobals()
    })
})

describe('httpApi category deletion', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    test('listCategoryTransactions queries the search endpoint and maps ids to strings', async () => {
        const fetchMock = vi.fn<typeof fetch>(async () =>
            new Response(
                JSON.stringify([
                    {
                        id: 7,
                        date: '2026-09-01',
                        amount: -5,
                        currency: 'CHF',
                        description: 'Kiosk',
                        categoryId: '3',
                        tags: []
                    },
                ]),
                {status: 200, headers: {'Content-Type': 'application/json'}},
            ),
        )
        vi.stubGlobal('fetch', fetchMock)

        const result = await httpApi.listCategoryTransactions('3')

        expect(fetchMock.mock.calls[0][0]).toBe('/api/categories/3/transactions')
        expect(result).toEqual([
            {id: '7', date: '2026-09-01', amount: -5, currency: 'CHF', description: 'Kiosk', categoryId: '3', tags: []},
        ])
    })

    test('deleteCategory sends DELETE with the reassignments as JSON body', async () => {
        const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, {status: 204}))
        vi.stubGlobal('fetch', fetchMock)

        await httpApi.deleteCategory('3', [{transactionId: '7', categoryId: '4'}])

        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/categories/3')
        expect(init?.method).toBe('DELETE')
        expect(JSON.parse(init?.body as string)).toEqual({
            reassignments: [{transactionId: '7', categoryId: '4'}],
        })
    })
})

describe('httpApi settings and data', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    function stubFetch(response: Response) {
        const fetchMock = vi.fn<typeof fetch>(async () => response)
        vi.stubGlobal('fetch', fetchMock)
        return fetchMock
    }

    test('getSettings reads /api/settings', async () => {
        const fetchMock = stubFetch(new Response(JSON.stringify({currency: 'EUR', locale: null}), {status: 200}))

        expect(await httpApi.getSettings()).toEqual({currency: 'EUR', locale: null})
        expect(fetchMock.mock.calls[0][0]).toBe('/api/settings')
    })

    test('updateSettings sends PUT with the settings as JSON body', async () => {
        const fetchMock = stubFetch(new Response(JSON.stringify({currency: 'EUR', locale: null}), {status: 200}))

        await httpApi.updateSettings({currency: 'EUR'})

        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/settings')
        expect(init?.method).toBe('PUT')
        expect(JSON.parse(init?.body as string)).toEqual({currency: 'EUR'})
    })

    test('clearAllData sends DELETE to /api/settings/data', async () => {
        const fetchMock = stubFetch(new Response(null, {status: 204}))

        await httpApi.clearAllData()

        const [url, init] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/settings/data')
        expect(init?.method).toBe('DELETE')
    })

    test('getVersionInfo reads /api/settings/version', async () => {
        const info = {current: '1.2.0', latest: '1.3.0', updateAvailable: true, releaseUrl: 'https://example.test/r'}
        const fetchMock = stubFetch(new Response(JSON.stringify(info), {status: 200}))

        expect(await httpApi.getVersionInfo()).toEqual(info)
        expect(fetchMock.mock.calls[0][0]).toBe('/api/settings/version')
    })
})

describe('httpApi error handling', () => {
    test('rejects when the backend responds with an error status', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response(null, {status: 500, statusText: 'Internal Server Error'})),
        )

        await expect(httpApi.listTransactions({month: '2026-09', limit: 20, offset: 0})).rejects.toThrow(/500/)

        vi.unstubAllGlobals()
    })
})
