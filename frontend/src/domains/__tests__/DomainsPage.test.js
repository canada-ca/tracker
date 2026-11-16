import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { fireEvent, render, waitFor, within } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import DomainsPage from '../DomainsPage'
import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import { IS_USER_SUPER_ADMIN, PAGINATED_DOMAINS } from '../../graphql/queries'
import { TourProvider } from '../../userOnboarding/contexts/TourContext'

describe('<DomainsPage />', () => {
  const mocks = [
    {
      request: {
        query: PAGINATED_DOMAINS,
        variables: {
          first: 50,
          orderBy: { field: 'DOMAIN', direction: 'ASC' },
          search: '',
          isAffiliated: true,
          filters: [],
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
                    ciphers: 'pass',
                    curves: 'pass',
                    dkim: 'pass',
                    dmarc: 'pass',
                    hsts: 'pass',
                    https: 'pass',
                    policy: 'pass',
                    protocols: 'pass',
                    spf: 'pass',
                    ssl: 'pass',
                  },
                  hasDMARCReport: true,
                  userHasPermission: true,
                  rcode: 'NOERROR',
                  blocked: false,
                  wildcardSibling: false,
                  webScanPending: false,
                  archived: false,
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
                    ciphers: 'pass',
                    curves: 'pass',
                    dkim: 'pass',
                    dmarc: 'pass',
                    hsts: 'pass',
                    https: 'pass',
                    policy: 'pass',
                    protocols: 'pass',
                    spf: 'pass',
                    ssl: 'pass',
                  },
                  hasDMARCReport: true,
                  userHasPermission: true,
                  rcode: 'NOERROR',
                  blocked: false,
                  wildcardSibling: false,
                  webScanPending: false,
                  archived: false,
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
        variables: {
          first: 50,
          orderBy: { field: 'DOMAIN', direction: 'ASC' },
          search: '',
          isAffiliated: false,
          filters: [],
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
                    ciphers: 'pass',
                    curves: 'pass',
                    dkim: 'pass',
                    dmarc: 'pass',
                    hsts: 'pass',
                    https: 'pass',
                    policy: 'pass',
                    protocols: 'pass',
                    spf: 'pass',
                    ssl: 'pass',
                  },
                  hasDMARCReport: true,
                  userHasPermission: true,
                  rcode: 'NOERROR',
                  blocked: false,
                  wildcardSibling: false,
                  webScanPending: false,
                  archived: false,
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
                    ciphers: 'pass',
                    curves: 'pass',
                    dkim: 'pass',
                    dmarc: 'pass',
                    hsts: 'pass',
                    https: 'pass',
                    policy: 'pass',
                    protocols: 'pass',
                    spf: 'pass',
                    ssl: 'pass',
                  },
                  hasDMARCReport: true,
                  userHasPermission: true,
                  rcode: 'NOERROR',
                  blocked: false,
                  wildcardSibling: false,
                  webScanPending: false,
                  archived: false,
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
          first: 50,
          orderBy: { field: 'DOMAIN', direction: 'ASC' },
          search: '',
          isAffiliated: false,
          filters: [],
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
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                  <TourProvider>
                    <DomainsPage />
                  </TourProvider>
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => expect(queryByText(/tbs-sct.gc.ca/i)).toBeInTheDocument())
    })

    it('handles an empty list of domains', async () => {
      const { queryByText } = render(
        <MockedProvider mocks={empty} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                  <TourProvider>
                    <DomainsPage />
                  </TourProvider>
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => expect(queryByText(/No Domains/i)).toBeInTheDocument())
    })

    describe('domain card links', () => {
      const router = createMemoryRouter(
        [
          {
            path: '/',
            element: <div>Landing Page</div>,
          },
          {
            path: '/domains',
            element: <DomainsPage />,
          },
        ],
        {
          initialEntries: ['/domains'],
          initialIndex: 0,
        },
      )
      it('takes user to DMARC Report page', async () => {
        const { getAllByText } = render(
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
                  <TourProvider>
                    <RouterProvider router={router}>
                      <DomainsPage />
                    </RouterProvider>
                  </TourProvider>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const currentYear = new Date().getFullYear()

        await waitFor(() => {
          const reportLinks = getAllByText(/DMARC Report/i)
          fireEvent.click(reportLinks[0])
          expect(router.state.location.pathname).toEqual(
            `/domains/tbs-sct.gc.ca/dmarc-report/LAST30DAYS/${currentYear}`,
          )
        })
      })

      it('takes user to Guidance page', async () => {
        const router = createMemoryRouter(
          [
            {
              path: '/',
              element: <div>Landing Page</div>,
            },
            {
              path: '/domains',
              element: <DomainsPage />,
            },
          ],
          {
            initialEntries: ['/domains'],
            initialIndex: 0,
          },
        )
        const { getAllByRole } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
            <UserVarProvider
              userVar={makeVar({
                userName: 'testUser@test.com',
                emailValidated: true,
              })}
            >
              <ChakraProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <TourProvider>
                    <RouterProvider router={router}>
                      <DomainsPage />
                    </RouterProvider>
                  </TourProvider>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        await waitFor(() => {
          const guidanceLinks = getAllByRole('link', { name: /View Results/i })
          fireEvent.click(guidanceLinks[0])
          expect(router.state.location.pathname).toEqual('/domains/tbs-sct.gc.ca')
        })
      })
    })

    describe('filtering options', () => {
      describe('search bar', () => {
        it('correctly filters results', async () => {
          const { getByPlaceholderText, queryByText } = render(
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
                    <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                      <TourProvider>
                        <DomainsPage />
                      </TourProvider>
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
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
          const { getByLabelText } = render(
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
                    <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                      <TourProvider>
                        <DomainsPage />
                      </TourProvider>
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )

          await waitFor(() => {
            const sortSelect = getByLabelText('Sort by field')
            fireEvent.change(sortSelect, { target: { value: 'LAST_RAN' } })
          })
        })
      })
    })
  })

  describe('PHP quick filter', () => {
    const superAdminMock = (isUserSuperAdmin) => ({
      request: { query: IS_USER_SUPER_ADMIN },
      result: { data: { isUserSuperAdmin } },
    })
    const unfilteredMock = mocks[1]
    const vulnerablePhpMock = {
      request: {
        query: PAGINATED_DOMAINS,
        variables: {
          ...unfilteredMock.request.variables,
          filters: [{ filterCategory: 'TAGS', comparison: 'EQUAL', filterValue: 'PHP_VULNERABLE' }],
        },
      },
      result: {
        data: {
          findMyDomains: {
            ...unfilteredMock.result.data.findMyDomains,
            edges: [
              {
                ...unfilteredMock.result.data.findMyDomains.edges[0],
                node: {
                  ...unfilteredMock.result.data.findMyDomains.edges[0].node,
                  id: 'cGhwLmdjLmNh',
                  domain: 'php.gc.ca',
                  phpResult: {
                    status: 'VULNERABLE',
                    version: 'PHP/8.1.2-1ubuntu2.19',
                    advisories: ['AL26-026'],
                    cves: ['CVE-2026-109618', 'CVE-2026-109619'],
                    evidence: ['X-Powered-By: PHP/8.1.2-1ubuntu2.19'],
                    __typename: 'PhpResult',
                  },
                },
              },
            ],
          },
        },
      },
    }

    function renderPage(pageMocks) {
      return render(
        <MockedProvider mocks={pageMocks} cache={createCache()}>
          <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                  <TourProvider>
                    <DomainsPage />
                  </TourProvider>
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
    }

    it('is not shown to users who are not super admins', async () => {
      const { queryByText } = renderPage([...mocks, superAdminMock(false), superAdminMock(false)])

      await waitFor(() => expect(queryByText(/tbs-sct.gc.ca/i)).toBeInTheDocument())
      expect(queryByText('Filter By PHP: vulnerable')).not.toBeInTheDocument()
    })

    it("filters a super admin's list to PHP: vulnerable", async () => {
      const { findByText } = renderPage([...mocks, vulnerablePhpMock, superAdminMock(true), superAdminMock(true)])

      fireEvent.click(await findByText('Filter By PHP: vulnerable'))

      const card = (await findByText('php.gc.ca')).closest('li')
      expect(within(card).getByText('PHP: vulnerable')).toBeInTheDocument()
    })
  })
})
