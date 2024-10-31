import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { createMemoryHistory } from 'history'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import DomainsPage from '../DomainsPage'

import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import { PAGINATED_DOMAINS } from '../../graphql/queries'
import { TourProvider } from '../../userOnboarding/contexts/TourContext'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
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
          first: 10,
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
          first: 10,
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
      it('takes user to DMARC Report page', async () => {
        const currentYear = new Date().getFullYear();
        const { getAllByText, getByText } = render(
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
                  <MemoryRouter initialEntries={['/domains']}>
                    <TourProvider>
                      <Routes>
                        <Route path="/domains" element={<DomainsPage />} />
                        <Route path="/domains/:domain/dmarc-report/:period/:year" element={<div>DMARC Report Page</div>} />
                      </Routes>
                    </TourProvider>
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>
        );
    
        await waitFor(() => {
          const reportLinks = getAllByText(/DMARC Report/i);
          fireEvent.click(reportLinks[0]);
          expect(getByText(/DMARC Report Page/i)).toBeInTheDocument(); // Check for the presence of the DMARC Report Page
        });
      });
    
      it('takes user to Guidance page', async () => {
        const { getAllByRole, getByText } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
            <UserVarProvider
              userVar={makeVar({
                userName: 'testUser@test.com',
                emailValidated: true,
              })}
            >
              <ChakraProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/domains']}>
                    <TourProvider>
                      <Routes>
                        <Route path="/domains" element={<DomainsPage />} />
                        <Route path="/domains/:domain" element={<div>Guidance Page</div>} />
                      </Routes>
                    </TourProvider>
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>
        );
    
        await waitFor(() => {
          const guidanceLinks = getAllByRole('link', { name: /View Results/i });
          fireEvent.click(guidanceLinks[0]);
          expect(getByText(/Guidance Page/i)).toBeInTheDocument(); // Check for the presence of the Guidance Page
        });
      });
    });
    

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
})
