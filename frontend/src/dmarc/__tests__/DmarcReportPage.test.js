import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Router } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory } from 'history'

import DmarcReportPage from '../DmarcReportPage'

import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import { rawDmarcReportGraphData } from '../../fixtures/dmarcReportGraphData'
import { rawDmarcReportData } from '../../fixtures/dmarcReportData.js'
import {
  DMARC_REPORT_GRAPH,
  PAGINATED_DMARC_REPORT,
} from '../../graphql/queries'

// ** need to mock the ResizeObserver and polute the window object to avoid errors
class ResizeObserver {
  observe() {
    // do nothing
  }

  unobserve() {
    // do nothing
  }

  disconnect() {
    // do nothing
  }
}

window.ResizeObserver = ResizeObserver
// **

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

const mocks = [
  {
    request: {
      query: DMARC_REPORT_GRAPH,
      variables: {
        domain: 'test-domain',
      },
    },
    result: rawDmarcReportGraphData,
  },
  {
    request: {
      query: PAGINATED_DMARC_REPORT,
      variables: {
        domain: 'test-domain',
        month: 'LAST30DAYS',
        year: '2020',
        first: 50,
        after: '',
      },
    },
    result: rawDmarcReportData,
  },
  {
    request: {
      query: PAGINATED_DMARC_REPORT,
      variables: {
        domain: 'test-domain',
        month: 'AUGUST',
        year: '2020',
        first: 50,
        after: '',
      },
    },
    result: {
      data: {
        findDomainByDomain: {
          id: 'testid=',
          __typename: 'Domain',
          dmarcSummaryByPeriod: {
            __typename: 'Period',
            domain: { domain: 'august.domain' },
            month: 'AUGUST',
            year: '2020',
            detailTables: {
              fullPass: {
                edges: [
                  {
                    cursor: 'testid==',
                    node: {
                      sourceIpAddress: '123.123.123.123',
                      envelopeFrom: null,
                      dkimDomains: 'full-pass-dkim-domains-august.domain',
                      dkimSelectors: 'selectortest',
                      dnsHost: 'test.dns',
                      headerFrom: 'test.header.ca',
                      spfDomains: 'test.spf.ca',
                      totalMessages: 536,
                      __typename: 'FullPassTable',
                    },
                    __typename: 'FullPassTableEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: 'endcursor=',
                  hasPreviousPage: false,
                  startCursor: 'startcursor==',
                  __typename: 'PageInfo',
                },
                __typename: 'FullPassTableConnection',
              },
              dkimFailure: {
                edges: [
                  {
                    node: {
                      dkimAligned: false,
                      dkimDomains: 'dkim-failure-dkim-domains-august.domain',
                      dkimResults: '',
                      dkimSelectors: '',
                      dnsHost: 'testhost',
                      envelopeFrom: null,
                      guidance: 'testguidance',
                      headerFrom: 'test.domain.ca',
                      sourceIpAddress: '123.123.123.123',
                      totalMessages: 112,
                      __typename: 'DkimFailureTable',
                    },
                    __typename: 'DkimFailureTableEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: 'endcursor=',
                  hasPreviousPage: false,
                  startCursor: 'startcursor=',
                  __typename: 'PageInfo',
                },
                __typename: 'DkimFailureTableConnection',
              },
              spfFailure: {
                edges: [
                  {
                    node: {
                      dnsHost: 'test.dns',
                      envelopeFrom: null,
                      guidance: 'test.guidance',
                      headerFrom: 'test.header',
                      sourceIpAddress: '123.123.123.123',
                      spfAligned: false,
                      spfDomains: 'spf-failure-spf-domains-august.domain',
                      spfResults: 'pass',
                      totalMessages: 112,
                      __typename: 'SpfFailureTable',
                    },
                    __typename: 'SpfFailureTableEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: 'endcursor==',
                  hasPreviousPage: false,
                  startCursor: 'startcursor',
                  __typename: 'PageInfo',
                },
                __typename: 'SpfFailureTableConnection',
              },
              dmarcFailure: {
                edges: [
                  {
                    node: {
                      dkimDomains: 'dmarc-failure-dkim-domains-august.domain',
                      dkimSelectors: '',
                      disposition: 'none',
                      dnsHost: 'test.dns.ca',
                      envelopeFrom: null,
                      headerFrom: 'test.header.ca',
                      sourceIpAddress: '123.123.123.123',
                      spfDomains: 'test.spf.ca',
                      totalMessages: 112,
                      __typename: 'DmarcFailureTable',
                    },
                    __typename: 'DmarcFailureTableEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: 'endcursor',
                  hasPreviousPage: false,
                  startCursor: 'startcursor=',
                  __typename: 'PageInfo',
                },
                __typename: 'DmarcFailureTableConnection',
              },
              __typename: 'DetailTables',
            },
          },
        },
      },
    },
  },
]

describe('<DmarcReportPage />', () => {
  it('renders header', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={[
                  '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
                ]}
                initialIndex={0}
              >
                <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                  <DmarcReportPage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => getAllByText(/test-domain/i))
  })

  it('renders date selector', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={[
                  '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
                ]}
                initialIndex={0}
              >
                <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                  <DmarcReportPage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => getAllByText(/Showing data for period:/i))
  })

  it('renders bar graph', async () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={[
                  '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
                ]}
                initialIndex={0}
              >
                <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                  <DmarcReportPage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => getByText(/Mar-20/))
  })

  it('renders tables', async () => {
    const { getByRole, findByRole } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={[
                  '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
                ]}
                initialIndex={0}
              >
                <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                  <DmarcReportPage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await findByRole('button', { name: /DKIM Failures by IP Address/i })
    getByRole('button', { name: /SPF Failures by IP Address/i })
    getByRole('button', { name: /Fully Aligned by IP Address/i })
    getByRole('button', { name: /DMARC Failures by IP Address/i })
  })

  it('Shows message when domain does not support aggregate data', async () => {
    const mocks = [
      {
        request: {
          query: DMARC_REPORT_GRAPH,
          variables: {
            domain: 'test-domain',
          },
        },
        result: rawDmarcReportGraphData,
      },
      {
        request: {
          query: PAGINATED_DMARC_REPORT,
          variables: {
            domain: 'test-domain',
            month: 'LAST30DAYS',
            year: '2020',
            first: 50,
            after: '',
          },
        },
        result: { data: { findDomainByDomain: { hasDMARCReport: false } } },
      },
    ]

    const { findByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={[
                  '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
                ]}
                initialIndex={0}
              >
                <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                  <DmarcReportPage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await findByText(/test-domain does not support aggregate data/)
  })

  describe('changes period tables', () => {
    it('the url changes', async () => {
      const history = createMemoryHistory({
        initialEntries: ['/domains/test-domain/dmarc-report/LAST30DAYS/2020'],
        initialIndex: 0,
      })
      const { getByRole, findByRole } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <Router history={history}>
                  <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                    <DmarcReportPage />
                  </Route>
                </Router>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      await findByRole('button', { name: /Fully Aligned by IP Address/i })

      const periodSelector = getByRole('combobox', {
        name: /Showing data for period/i,
      })

      expect(history.location.pathname).toEqual(
        '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
      )

      userEvent.selectOptions(periodSelector, 'AUGUST, 2020')

      expect(history.location.pathname).toEqual(
        '/domains/test-domain/dmarc-report/AUGUST/2020',
      )
    })
    it('the data changes', async () => {
      const history = createMemoryHistory({
        initialEntries: ['/domains/test-domain/dmarc-report/LAST30DAYS/2020'],
        initialIndex: 0,
      })
      const { getByRole, findByRole, queryByText } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <Router history={history}>
                  <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                    <DmarcReportPage />
                  </Route>
                </Router>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      // page is loaded
      await findByRole('button', { name: /Fully Aligned by IP Address/i })

      const periodSelector = getByRole('combobox', {
        name: /Showing data for period/i,
      })

      expect(history.location.pathname).toEqual(
        '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
      )

      // check current state of data
      expect(
        queryByText(/full-pass-dkim-domains-L30D.domain/),
      ).toBeInTheDocument()
      expect(
        queryByText(/dkim-failure-dkim-domains-L30D.domain/),
      ).toBeInTheDocument()
      expect(
        queryByText(/spf-failure-spf-domains-L30D.domain/),
      ).toBeInTheDocument()
      expect(
        queryByText(/dmarc-failure-dkim-domains-L30D.domain/),
      ).toBeInTheDocument()

      expect(
        queryByText(/full-pass-dkim-domains-august.domain/),
      ).not.toBeInTheDocument()
      expect(
        queryByText(/dkim-failure-dkim-domains-august.domain/),
      ).not.toBeInTheDocument()
      expect(
        queryByText(/spf-failure-spf-domains-august.domain/),
      ).not.toBeInTheDocument()
      expect(
        queryByText(/dmarc-failure-dkim-domains-august.domain/),
      ).not.toBeInTheDocument()

      // change date
      userEvent.selectOptions(periodSelector, 'AUGUST, 2020')

      expect(history.location.pathname).toEqual(
        '/domains/test-domain/dmarc-report/AUGUST/2020',
      )

      // page is loaded
      await findByRole('button', { name: /Fully Aligned by IP Address/i })

      // check new state of data
      expect(
        queryByText(/full-pass-dkim-domains-L30D.domain/),
      ).not.toBeInTheDocument()
      expect(
        queryByText(/dkim-failure-dkim-domains-L30D.domain/),
      ).not.toBeInTheDocument()
      expect(
        queryByText(/spf-failure-spf-domains-L30D.domain/),
      ).not.toBeInTheDocument()
      expect(
        queryByText(/dmarc-failure-dkim-domains-L30D.domain/),
      ).not.toBeInTheDocument()

      expect(
        queryByText(/full-pass-dkim-domains-august.domain/),
      ).toBeInTheDocument()
      expect(
        queryByText(/dkim-failure-dkim-domains-august.domain/),
      ).toBeInTheDocument()
      expect(
        queryByText(/spf-failure-spf-domains-august.domain/),
      ).toBeInTheDocument()
      expect(
        queryByText(/dmarc-failure-dkim-domains-august.domain/),
      ).toBeInTheDocument()
    })
  })
})
