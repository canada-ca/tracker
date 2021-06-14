import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter, Route, Router, Switch } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { PAGINATED_DOMAINS } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { createCache } from '../client'
import DomainsPage from '../DomainsPage'
import { createMemoryHistory } from 'history'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<DomainsPage />', () => {
  const mocks = [
    {
      request: {
        query: PAGINATED_DOMAINS,
        variables: {
          first: 10,
          orderBy: { field: 'DOMAIN', direction: 'ASC' },
          search: '',
        },
      },
      result: {
        data: {
          findMyDomains: {
            edges: [
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: 'T3JnYW5pemF0aW9uczoyCg==',
                  domain: 'tbs-sct.gc.ca',
                  lastRan: 'somedate',
                  status: {
                    dkim: 'PASS',
                    dmarc: 'PASS',
                    https: 'PASS',
                    spf: 'PASS',
                    ssl: 'PASS',
                  },
                  hasDMARCReport: true,
                  __typename: 'Domains',
                },
                __typename: 'DomainsEdge',
              },
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: 'T3JnYW5pemF0aW9uczoxCg==',
                  domain: 'rcmp-grc.gc.ca',
                  lastRan: 'organization-two',
                  status: {
                    dkim: 'PASS',
                    dmarc: 'PASS',
                    https: 'PASS',
                    spf: 'PASS',
                    ssl: 'PASS',
                  },
                  hasDMARCReport: true,
                  __typename: 'Domains',
                },
                __typename: 'DomainsEdge',
              },
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              hasPreviousPage: false,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              __typename: 'PageInfo',
            },
            __typename: 'DomainsConnection',
          },
        },
      },
    },
    {
      request: {
        query: PAGINATED_DOMAINS,
        variables: { first: 10 },
      },
      result: {
        data: {
          findMyDomains: {
            edges: [
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: 'T3JnYW5pemF0aW9uczoyCg==',
                  domain: 'tbs-sct.gc.ca',
                  lastRan: 'somedate',
                  status: {
                    dkim: 'PASS',
                    dmarc: 'PASS',
                    https: 'PASS',
                    spf: 'PASS',
                    ssl: 'PASS',
                  },
                  hasDMARCReport: true,
                  __typename: 'Domains',
                },
                __typename: 'DomainsEdge',
              },
              {
                cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                node: {
                  id: 'T3JnYW5pemF0aW9uczoxCg==',
                  domain: 'rcmp-grc.gc.ca',
                  lastRan: 'organization-two',
                  status: {
                    dkim: 'PASS',
                    dmarc: 'PASS',
                    https: 'PASS',
                    spf: 'PASS',
                    ssl: 'PASS',
                  },
                  hasDMARCReport: true,
                  __typename: 'Domains',
                },
                __typename: 'DomainsEdge',
              },
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              hasPreviousPage: false,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              __typename: 'PageInfo',
            },
            __typename: 'DomainsConnection',
          },
        },
      },
    },
  ]

  const empty = [
    {
      request: {
        query: PAGINATED_DOMAINS,
        variables: {
          first: 10,
          orderBy: { field: 'DOMAIN', direction: 'ASC' },
          search: '',
        },
      },
      result: {
        data: {
          findMyDomains: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              hasPreviousPage: false,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              __typename: 'PageInfo',
            },
            __typename: 'DomainsConnection',
          },
        },
      },
    },
  ]

  describe('given a list of domains', () => {
    it('displays a list of domains', async () => {
      const { queryByText } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                  <DomainsPage />
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>
        </MockedProvider>,
      )

      await waitFor(() =>
        expect(queryByText(/tbs-sct.gc.ca/i)).toBeInTheDocument(),
      )
    })

    it('handles an empty list of domains', async () => {
      const { queryByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <MockedProvider mocks={empty} cache={createCache()}>
                  <DomainsPage />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      await waitFor(() =>
        expect(queryByText(/No Domains/i)).toBeInTheDocument(),
      )
    })

    describe('domain card links', () => {
      const history = createMemoryHistory({
        initialEntries: ['/domains'],
        initialIndex: 0,
      })
      it('takes user to DMARC Report page', async () => {
        const { getAllByText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                  <MockedProvider mocks={mocks} cache={createCache()}>
                    <Router history={history}>
                      <Switch>
                        <Route path="/domains" render={() => <DomainsPage />} />
                      </Switch>
                    </Router>
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )

        await waitFor(() => {
          const reportLinks = getAllByText(/DMARC Report/i)
          fireEvent.click(reportLinks[0])
          expect(history.location.pathname).toEqual(
            '/domains/tbs-sct.gc.ca/dmarc-report/LAST30DAYS/2021',
          )
        })
      })

      it('takes user to Guidance page', async () => {
        const { getAllByText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                  <MockedProvider mocks={mocks} cache={createCache()}>
                    <Router history={history}>
                      <Switch>
                        <Route path="/domains" render={() => <DomainsPage />} />
                      </Switch>
                    </Router>
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )

        await waitFor(() => {
          const guidanceLinks = getAllByText(/Guidance/i)
          fireEvent.click(guidanceLinks[0])
          expect(history.location.pathname).toEqual('/domains/tbs-sct.gc.ca')
        })
      })
    })

    describe('filtering options', () => {
      describe('search bar', () => {
        it('correctly filters results', async () => {
          const { getByPlaceholderText, queryByText } = render(
            <UserStateProvider
              initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                    <MockedProvider mocks={mocks} cache={createCache()}>
                      <DomainsPage />
                    </MockedProvider>
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserStateProvider>,
          )

          await waitFor(() => {
            expect(queryByText(/tbs-sct.gc.ca/)).toBeInTheDocument()
            expect(queryByText(/rcmp-grc.gc.ca/)).toBeInTheDocument()
          })

          await waitFor(() => {
            const search = getByPlaceholderText(/Search for a domain/)
            fireEvent.change(search, { target: { value: 'tbs-sct.gc.ca' } })
          })

          await waitFor(() => {
            expect(queryByText(/tbs-sct.gc.ca/)).toBeInTheDocument()
            expect(queryByText(/rcmp-grc.gc.ca/)).not.toBeInTheDocument()
          })
        })
      })

      describe('sort by select', () => {
        it('changes sorting order', async () => {
          const { getByTestId } = render(
            <UserStateProvider
              initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                    <MockedProvider mocks={mocks} cache={createCache()}>
                      <DomainsPage />
                    </MockedProvider>
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserStateProvider>,
          )

          await waitFor(() => {
            const sortSelect = getByTestId('sort-select')
            fireEvent.change(sortSelect, { target: { value: 'LAST_RAN' } })
          })
        })
      })
    })
  })
})
