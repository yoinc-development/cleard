import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { httpApi } from './httpApi'

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
                runningBalance: 4186.35,
              },
            ],
            filteredCount: 1,
            remainingCount: 0,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('maps the real backend response onto the frontend Transaction shape', async () => {
    const page = await httpApi.listTransactions({ month: '2026-09', limit: 20, offset: 0 })

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
        runningBalance: 4186.35,
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

describe('httpApi error handling', () => {
  test('rejects when the backend responds with an error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 500, statusText: 'Internal Server Error' })),
    )

    await expect(httpApi.listTransactions({ month: '2026-09', limit: 20, offset: 0 })).rejects.toThrow(/500/)

    vi.unstubAllGlobals()
  })
})
