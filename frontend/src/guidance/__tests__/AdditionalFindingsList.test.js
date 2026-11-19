import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'

import { AdditionalFindingsList } from '../AdditionalFindingsList'
import { DOMAIN_ADDITIONAL_FINDINGS } from '../../graphql/queries'
import { createCache } from '../../client'

const DOMAIN = 'example.ca'
const LAST_SEEN_DESC = { field: 'LAST_SEEN', direction: 'DESC' }

const makeFinding = (n) => ({
  __typename: 'AdditionalFinding',
  id: `finding-${n}`,
  source: 'subdomain-takeover',
  subject: `host-${n}.example.ca`,
  findingType: 'subdomain-takeover-cname',
  confidence: 'confirmed',
  reasonCode: `REASON_${n}`,
  firstSeen: '2024-01-01T00:00:00.000Z',
  lastSeen: '2024-01-02T00:00:00.000Z',
  evidence: { recordType: 'CNAME', target: `target-${n}.example.net` },
  attributes: {},
})

/** Builds a mock for one page. `numbers` are the finding numbers on the page. */
const pageMock = ({
  numbers,
  totalCount = numbers.length,
  hasNextPage = false,
  hasPreviousPage = false,
  first = 10,
  after,
  orderBy = LAST_SEEN_DESC,
}) => {
  const edges = numbers.map((n) => ({
    __typename: 'AdditionalFindingEdge',
    cursor: `cursor-${n}`,
    node: makeFinding(n),
  }))
  return {
    request: {
      query: DOMAIN_ADDITIONAL_FINDINGS,
      variables: { domain: DOMAIN, first, orderBy, ...(after ? { after } : {}) },
    },
    result: jest.fn(() => ({
      data: {
        findDomainByDomain: {
          __typename: 'Domain',
          id: 'domain-1',
          additionalFindings: {
            __typename: 'AdditionalFindingConnection',
            totalCount,
            pageInfo: {
              __typename: 'PageInfo',
              hasNextPage,
              hasPreviousPage,
              startCursor: edges.length ? edges[0].cursor : null,
              endCursor: edges.length ? edges.at(-1).cursor : null,
            },
            edges,
          },
        },
      },
    })),
  }
}

const renderList = (mocks) =>
  render(
    <MockedProvider mocks={mocks} cache={createCache()}>
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <AdditionalFindingsList domain={DOMAIN} />
        </I18nProvider>
      </ChakraProvider>
    </MockedProvider>,
  )

/** Matches the explanation line, which names the subject once per card. */
const cardFor = (n) => new RegExp(`host-${n}\\.example\\.ca is a CNAME`)

const subjectsShown = () => screen.queryAllByRole('heading', { level: 3 }).length

describe('<AdditionalFindingsList />', () => {
  it('shows a loading message before data arrives', () => {
    renderList([pageMock({ numbers: [1] })])

    expect(screen.getByText(/Loading Additional Findings/)).toBeInTheDocument()
  })

  it('renders a card per finding and the total count', async () => {
    renderList([pageMock({ numbers: [1, 2, 3] })])

    expect(await screen.findByText(cardFor(1))).toBeInTheDocument()
    expect(screen.getByText(cardFor(2))).toBeInTheDocument()
    expect(screen.getByText(cardFor(3))).toBeInTheDocument()
    expect(subjectsShown()).toBe(3)
    expect(screen.getByText(/3 total item\(s\)/)).toBeInTheDocument()
  })

  it('shows the empty message when the domain has no findings', async () => {
    renderList([pageMock({ numbers: [] })])

    expect(await screen.findByText('No additional findings for this domain.')).toBeInTheDocument()
    expect(subjectsShown()).toBe(0)
  })

  it('shows the error fallback when the query fails', async () => {
    renderList([
      {
        request: pageMock({ numbers: [] }).request,
        error: new Error('Network down'),
      },
    ])

    expect(await screen.findByText(/Network down/)).toBeInTheDocument()
    expect(subjectsShown()).toBe(0)
  })

  describe('ordering', () => {
    it('refetches with the selected order field', async () => {
      const firstSeenPage = pageMock({
        numbers: [9],
        orderBy: { field: 'FIRST_SEEN', direction: 'DESC' },
      })
      renderList([pageMock({ numbers: [1] }), firstSeenPage])
      await screen.findByText(cardFor(1))

      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Order by' }), 'FIRST_SEEN')

      expect(await screen.findByText(cardFor(9))).toBeInTheDocument()
      expect(firstSeenPage.result).toHaveBeenCalledTimes(1)
    })

    it('refetches with the opposite direction when the direction button is clicked', async () => {
      const ascendingPage = pageMock({ numbers: [7], orderBy: { field: 'LAST_SEEN', direction: 'ASC' } })
      renderList([pageMock({ numbers: [1] }), ascendingPage])
      await screen.findByText(cardFor(1))

      await userEvent.click(screen.getByRole('button', { name: 'Descending' }))

      expect(await screen.findByText(cardFor(7))).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Ascending' })).toBeInTheDocument()
    })

    it('returns to the first page when the order changes', async () => {
      const firstSeenPage = pageMock({
        numbers: [8, 9],
        totalCount: 10,
        hasNextPage: true,
        first: 5,
        orderBy: { field: 'FIRST_SEEN', direction: 'DESC' },
      })
      renderList([
        pageMock({ numbers: [1, 2, 3, 4, 5], totalCount: 10, hasNextPage: true }),
        pageMock({ numbers: [1, 2, 3, 4, 5], totalCount: 10, hasNextPage: true, first: 5 }),
        pageMock({ numbers: [6, 7, 8, 9, 10], totalCount: 10, hasPreviousPage: true, first: 5, after: 'cursor-5' }),
        firstSeenPage,
      ])
      await screen.findByText(cardFor(1))
      await selectPageSize(5)
      await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
      await screen.findByText(cardFor(6))

      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Order by' }), 'FIRST_SEEN')

      expect(await screen.findByText(cardFor(8))).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    })
  })

  describe('pagination', () => {
    it('refetches with the new page size', async () => {
      const smallPage = pageMock({ numbers: [1, 2, 3, 4, 5], totalCount: 3, hasNextPage: true, first: 5 })
      renderList([pageMock({ numbers: [1, 2, 3] }), smallPage])
      await screen.findByText(cardFor(1))

      await selectPageSize(5)

      await waitFor(() => expect(smallPage.result).toHaveBeenCalledTimes(1))
      expect(screen.getByRole('combobox', { name: 'Items per page' })).toHaveValue('5')
    })

    it('loads the next page with the end cursor and returns with Previous', async () => {
      const pageTwo = pageMock({
        numbers: [6, 7, 8, 9, 10],
        totalCount: 10,
        hasPreviousPage: true,
        first: 5,
        after: 'cursor-5',
      })
      renderList([
        pageMock({ numbers: [1, 2, 3, 4, 5], totalCount: 10, hasNextPage: true }),
        pageMock({ numbers: [1, 2, 3, 4, 5], totalCount: 10, hasNextPage: true, first: 5 }),
        pageTwo,
      ])
      await screen.findByText(cardFor(1))
      await selectPageSize(5)
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()

      await userEvent.click(screen.getByRole('button', { name: 'Next page' }))

      expect(await screen.findByText(cardFor(6))).toBeInTheDocument()
      expect(screen.getByText(cardFor(7))).toBeInTheDocument()
      expect(screen.queryByText(cardFor(1))).not.toBeInTheDocument()
      expect(pageTwo.result).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()

      await userEvent.click(screen.getByRole('button', { name: 'Previous page' }))

      expect(await screen.findByText(cardFor(1))).toBeInTheDocument()
      expect(screen.queryByText(cardFor(6))).not.toBeInTheDocument()
      expect(pageTwo.result).toHaveBeenCalledTimes(1)
    })
  })
})

/** Switches the page size from the default 10. Mocks for the initial `first: 10` request must be supplied. */
async function selectPageSize(size) {
  const select = await screen.findByRole('combobox', { name: 'Items per page' })
  await userEvent.selectOptions(select, String(size))
}
