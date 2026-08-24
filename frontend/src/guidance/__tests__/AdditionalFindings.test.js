import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { ChakraProvider, theme } from '@chakra-ui/react'
import userEvent from '@testing-library/user-event'

import { AdditionalFindings } from '../AdditionalFindings'
import { GUIDANCE_ADDITIONAL_FINDINGS } from '../../graphql/queries'

const renderComponent = (mocks) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter>
            <AdditionalFindings domain="test.domain" />
          </MemoryRouter>
        </I18nProvider>
      </ChakraProvider>
    </MockedProvider>,
  )
}

describe('<AdditionalFindings />', () => {
  it('renders loading state', () => {
    renderComponent([])

    expect(screen.getByText(/Loading Additional Findings/i)).toBeInTheDocument()
  })

  it('renders empty state when there are no findings', async () => {
    const mocks = [
      {
        request: {
          query: GUIDANCE_ADDITIONAL_FINDINGS,
          variables: {
            domain: 'test.domain',
            first: 10,
            limit: 10,
            filters: [],
            orderBy: { field: 'LAST_SEEN', direction: 'DESC' },
          },
        },
        result: {
          data: {
            findDomainByDomain: {
              additionalFindings: {
                edges: [],
                totalCount: 0,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: null,
                  endCursor: null,
                },
              },
            },
          },
        },
      },
    ]

    renderComponent(mocks)

    await waitFor(() => {
      expect(screen.getByText('No additional findings available at this time.')).toBeInTheDocument()
    })
  })

  it('renders findings cards from paginated nodes', async () => {
    const mocks = [
      {
        request: {
          query: GUIDANCE_ADDITIONAL_FINDINGS,
          variables: {
            domain: 'test.domain',
            first: 10,
            limit: 10,
            filters: [],
            orderBy: { field: 'LAST_SEEN', direction: 'DESC' },
          },
        },
        result: {
          data: {
            findDomainByDomain: {
              additionalFindings: {
                edges: [
                  {
                    cursor: 'cursor-1',
                    node: {
                      source: 'scanner-a',
                      findingType: 'dns_misconfig',
                      severity: 'high',
                      confidence: 'medium',
                      status: 'ongoing',
                      firstSeen: '2026-01-01',
                      lastSeen: '2026-08-01',
                      reasonCode: 'RC-1',
                      occurenceCount: 2,
                      subject: 'scanner.subject',
                      attributes: { key: 'value' },
                      evidence: { confidenceReason: 'correlated signals' },
                    },
                  },
                ],
                totalCount: 1,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'cursor-1',
                  endCursor: 'cursor-1',
                },
              },
            },
          },
        },
      },
    ]

    renderComponent(mocks)

    await waitFor(() => {
      expect(screen.getByText('dns_misconfig')).toBeInTheDocument()
      expect(screen.getByText('1 total item(s)')).toBeInTheDocument()
    })

    userEvent.click(screen.getByRole('button', { name: /dns_misconfig/i }))

    await waitFor(() => {
      expect(screen.getByText(/Occurrence count:/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Filter by source' })).toBeInTheDocument()
    })
  })

  it('applies source filter from a finding action', async () => {
    const mocks = [
      {
        request: {
          query: GUIDANCE_ADDITIONAL_FINDINGS,
          variables: {
            domain: 'test.domain',
            first: 10,
            limit: 10,
            filters: [],
            orderBy: { field: 'LAST_SEEN', direction: 'DESC' },
          },
        },
        result: {
          data: {
            findDomainByDomain: {
              additionalFindings: {
                edges: [
                  {
                    cursor: 'cursor-1',
                    node: {
                      source: 'scanner-a',
                      findingType: 'dns_misconfig',
                    },
                  },
                ],
                totalCount: 1,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'cursor-1',
                  endCursor: 'cursor-1',
                },
              },
            },
          },
        },
      },
      {
        request: {
          query: GUIDANCE_ADDITIONAL_FINDINGS,
          variables: {
            domain: 'test.domain',
            first: 10,
            limit: 10,
            filters: [{ filterCategory: 'source', comparison: '==', filterValue: 'scanner-a' }],
            orderBy: { field: 'LAST_SEEN', direction: 'DESC' },
          },
        },
        result: {
          data: {
            findDomainByDomain: {
              additionalFindings: {
                edges: [
                  {
                    cursor: 'cursor-1',
                    node: {
                      source: 'scanner-a',
                      findingType: 'dns_misconfig',
                    },
                  },
                ],
                totalCount: 1,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'cursor-1',
                  endCursor: 'cursor-1',
                },
              },
            },
          },
        },
      },
    ]

    renderComponent(mocks)

    await waitFor(() => {
      expect(screen.getByText('dns_misconfig')).toBeInTheDocument()
    })

    userEvent.click(screen.getByRole('button', { name: /dns_misconfig/i }))
    userEvent.click(screen.getByRole('button', { name: 'Filter by source' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
    })
  })
})
