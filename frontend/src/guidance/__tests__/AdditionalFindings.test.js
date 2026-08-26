import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'

import { AdditionalFindings } from '../AdditionalFindings'
import { usePaginatedCollection } from '../../utilities/usePaginatedCollection'

jest.mock('../../utilities/usePaginatedCollection', () => ({
  usePaginatedCollection: jest.fn(),
}))

jest.mock('../../components/LoadingMessage', () => ({
  LoadingMessage: ({ children }) => <div data-testid="loading-message">Loading {children}</div>,
}))

jest.mock('../../components/ErrorFallbackMessage', () => ({
  ErrorFallbackMessage: ({ error }) => <div data-testid="error-fallback">Error: {error.message}</div>,
}))

jest.mock('../../components/RelayPaginationControls', () => ({
  RelayPaginationControls: () => <div data-testid="relay-pagination-controls" />,
}))

jest.mock('../../graphql/queries', () => ({
  GUIDANCE_ADDITIONAL_FINDINGS: 'GUIDANCE_ADDITIONAL_FINDINGS_QUERY',
}))

jest.mock('../additionalFindings.fixture.json', () => ({}), { virtual: true })

const baseHookState = {
  loading: false,
  isLoadingMore: false,
  error: null,
  nodes: [],
  next: jest.fn(),
  previous: jest.fn(),
  resetToFirstPage: jest.fn(),
  hasNextPage: false,
  hasPreviousPage: false,
  totalCount: 0,
}

const makeFinding = (overrides = {}) => ({
  source: 'scanner-a',
  findingType: 'dns_misconfig',
  severity: 'high',
  confidence: 'medium',
  status: 'open',
  firstSeen: '2026-01-01T00:00:00.000Z',
  lastSeen: '2026-08-01T00:00:00.000Z',
  reasonCode: 'RC-1',
  occurrenceCount: 2,
  subject: 'scanner.subject',
  attributes: { key: 'value' },
  evidence: { confidenceReason: 'correlated signals' },
  ...overrides,
})

const setup = (hookStateOverrides = {}) => {
  const hookState = {
    ...baseHookState,
    ...hookStateOverrides,
  }

  usePaginatedCollection.mockImplementation(() => hookState)

  render(
    <ChakraProvider>
      <I18nProvider i18n={i18n}>
        <AdditionalFindings domain="test.domain" />
      </I18nProvider>
    </ChakraProvider>,
  )

  return { hookState }
}

describe('<AdditionalFindings />', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    if (typeof userEvent.setup !== 'function') {
      userEvent.setup = () => ({
        click: async (...args) => userEvent.click(...args),
      })
    }
  })

  it('renders loading state', () => {
    setup({ loading: true })

    expect(screen.getByTestId('loading-message')).toHaveTextContent('Loading Additional Findings')
  })

  it('renders error state', () => {
    setup({ error: new Error('boom') })

    expect(screen.getByTestId('error-fallback')).toHaveTextContent('Error: boom')
  })

  it('renders empty findings state', () => {
    setup({ nodes: [] })

    expect(screen.getByText('No additional findings are available right now.')).toBeInTheDocument()
    expect(screen.getByText('Try rerunning the scan for this domain later.')).toBeInTheDocument()
  })

  it('renders one finding and expands with details', async () => {
    const user = userEvent.setup()
    setup({ nodes: [makeFinding()], totalCount: 1 })

    expect(screen.getByText('dns_misconfig')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /dns_misconfig/i }))

    expect(screen.getByText(/Occurrence count:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter findings by this source' })).toBeInTheDocument()
    expect(screen.getByText('Attributes')).toBeInTheDocument()
    expect(screen.getByText('Evidence')).toBeInTheDocument()
  })

  it('supports source filter add then remove and clear', async () => {
    const user = userEvent.setup()
    setup({
      nodes: [
        makeFinding({ source: 'scanner-a', findingType: 'finding-a' }),
        makeFinding({ source: 'scanner-b', findingType: 'finding-b', reasonCode: 'RC-2', subject: 'other.subject' }),
      ],
      totalCount: 2,
    })

    await user.click(screen.getByRole('button', { name: /finding-a/i }))
    await user.click(screen.getByRole('button', { name: 'Filter findings by this source' }))

    expect(screen.getByRole('button', { name: 'Remove source filter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove source filter' }))
    expect(screen.queryByText('Source: scanner-a')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /finding-a/i }))
    await user.click(screen.getByRole('button', { name: 'Filter findings by this source' }))

    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.queryByText('Source: scanner-a')).not.toBeInTheDocument()
  })

  it('toggles sort direction and sends updated hook args while resetting pagination', async () => {
    const user = userEvent.setup()
    const { hookState } = setup({ nodes: [makeFinding()], totalCount: 1 })

    const sortDirectionButton = screen.getByRole('button', {
      name: 'Sorting descending, activate for ascending',
    })

    await user.click(sortDirectionButton)

    expect(hookState.resetToFirstPage).toHaveBeenCalledTimes(1)

    const latestHookCallArgs = usePaginatedCollection.mock.calls[usePaginatedCollection.mock.calls.length - 1][0]
    expect(latestHookCallArgs.variables.orderBy.direction).toBe('ASC')
  })

  it('changes sort field and sends updated hook args while resetting pagination', () => {
    const { hookState } = setup({ nodes: [makeFinding()], totalCount: 1 })

    const sortFieldSelect = screen.getByRole('combobox', { name: 'Select sorting field' })

    fireEvent.change(sortFieldSelect, { target: { value: 'SEVERITY' } })

    expect(hookState.resetToFirstPage).toHaveBeenCalledTimes(1)

    const latestHookCallArgs = usePaginatedCollection.mock.calls[usePaginatedCollection.mock.calls.length - 1][0]
    expect(latestHookCallArgs.variables.orderBy.field).toBe('SEVERITY')
  })

})
