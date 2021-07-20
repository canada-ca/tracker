import React from 'react'
import { createMemoryHistory } from 'history'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Router, Switch } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import Organizations from '../Organizations'
import { PAGINATED_ORGANIZATIONS } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserVarProvider } from '../UserState'
import { createCache } from '../client'
import { makeVar } from '@apollo/client'
import userEvent from '@testing-library/user-event'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const summaries = {
  mail: {
    total: 86954,
    categories: [
      {
        name: 'pass',
        count: 7435,
        percentage: 50,
      },
      {
        name: 'fail',
        count: 7435,
        percentage: 43.5,
      },
    ],
  },
  web: {
    total: 54386,
    categories: [
      {
        name: 'pass',
        count: 7435,
        percentage: 50,
      },
      {
        name: 'fail',
        count: 7435,
        percentage: 43.5,
      },
    ],
  },
}

describe('<Organisations />', () => {
  describe('given a list of organizations', () => {
    it('displays a list of organizations', async () => {
      const mocks = [
        {
          request: {
            query: PAGINATED_ORGANIZATIONS,
            variables: {
              first: 10,
              field: 'NAME',
              direction: 'ASC',
              search: '',
              includeSuperAdminOrg: false,
            },
          },
          result: {
            data: {
              findMyOrganizations: {
                edges: [
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    node: {
                      id: 'T3JnYW5pemF0aW9uczoyCg==',
                      acronym: 'ORG1',
                      name: 'organization one',
                      slug: 'organization-one',
                      domainCount: 5,
                      verified: false,
                      summaries,
                      __typename: 'Organizations',
                    },
                    __typename: 'OrganizationsEdge',
                  },
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    node: {
                      id: 'T3JnYW5pemF0aW9uczoxCg==',
                      acronym: 'ORG2',
                      name: 'organization two',
                      slug: 'organization-two',
                      domainCount: 5,
                      verified: false,
                      summaries,
                      __typename: 'Organizations',
                    },
                    __typename: 'OrganizationsEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  hasPreviousPage: false,
                  startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  __typename: 'PageInfo',
                },
                __typename: 'OrganizationsConnection',
              },
            },
          },
        },
      ]

      const { getByText } = render(
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
                <MemoryRouter
                  initialEntries={['/organizations']}
                  initialIndex={0}
                >
                  <Organizations />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      // expect(getByText(/organization two/i)).toBeInTheDocument(),
      await waitFor(() =>
        expect(getByText(/organization one/i)).toBeInTheDocument(),
      )
    })

    it('navigates to an organization detail page when a link is clicked', async () => {
      const mocks = [
        {
          request: {
            query: PAGINATED_ORGANIZATIONS,
            variables: {
              first: 10,
              field: 'NAME',
              direction: 'ASC',
              search: '',
              includeSuperAdminOrg: false,
            },
          },
          result: {
            data: {
              findMyOrganizations: {
                edges: [
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    node: {
                      id: 'T3JnYW5pemF0aW9uczoyCg==',
                      acronym: 'ORG1',
                      name: 'organization one',
                      slug: 'organization-one',
                      domainCount: 5,
                      verified: false,
                      summaries,
                      __typename: 'Organizations',
                    },
                    __typename: 'OrganizationsEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  hasPreviousPage: false,
                  startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  __typename: 'PageInfo',
                },
                __typename: 'OrganizationsConnection',
              },
            },
          },
        },
        {
          request: {
            query: PAGINATED_ORGANIZATIONS,
            variables: {
              first: 10,
              after: 'YXJyYXljb25uZWN0aW9uOjA=',
              field: 'NAME',
              direction: 'ASC',
              search: '',
            },
          },
          result: {
            data: {
              findMyOrganizations: {
                edges: [
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    node: {
                      id: 'T3JnYW5pemF0aW9uczoxCg==',
                      acronym: 'ORG2',
                      name: 'organization two',
                      slug: 'organization-two',
                      domainCount: 5,
                      verified: false,
                      summaries,
                      __typename: 'Organizations',
                    },
                    __typename: 'OrganizationsEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  hasPreviousPage: true,
                  startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  __typename: 'PageInfo',
                },
                __typename: 'OrganizationsConnection',
              },
            },
          },
        },
        {
          request: {
            query: PAGINATED_ORGANIZATIONS,
            variables: {
              first: 10,
              after: 'YXJyYXljb25uZWN0aW9uOjA=',
              field: 'NAME',
              direction: 'ASC',
              search: '',
            },
          },
          result: {
            data: {
              findMyOrganizations: {
                edges: [
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    node: {
                      id: 'T3JnYW5pemF0aW9uczoxCg==',
                      acronym: 'ORG2',
                      name: 'organization two',
                      slug: 'organization-two',
                      domainCount: 5,
                      verified: false,
                      summaries,
                      __typename: 'Organizations',
                    },
                    __typename: 'OrganizationsEdge',
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  hasPreviousPage: true,
                  startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  __typename: 'PageInfo',
                },
                __typename: 'OrganizationsConnection',
              },
            },
          },
        },
      ]

      const history = createMemoryHistory({
        initialEntries: ['/organizations'],
        initialIndex: 0,
      })

      // from ../helpers/matchMedia, more information there
      // define matchMedia object, required for tests which have components that use matchMedia (or if they're children use matchMedia)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => {
          return {
            matches: query === '(min-width: 48em) and (max-width: 61.99em)',
            media: query,
            onchange: null,
            addListener: jest.fn(), // Deprecated
            removeListener: jest.fn(), // Deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          }
        }),
      })

      const { findByRole } = render(
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
                  <Switch>
                    <Route
                      path="/organizations"
                      render={() => <Organizations />}
                    />
                  </Switch>
                </Router>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const cardLink = await findByRole('link', /organization one/i)
      userEvent.click(cardLink)

      await waitFor(() =>
        expect(history.location.pathname).toEqual(
          '/organizations/organization-one',
        ),
      )
    })
  })

  describe('pagination', () => {
    describe(`when the "previous" button is clicked`, () => {
      it('displays the previous pagination result', async () => {
        const mocks = [
          {
            request: {
              query: PAGINATED_ORGANIZATIONS,
              variables: {
                first: 10,
                field: 'NAME',
                direction: 'ASC',
                search: '',
                includeSuperAdminOrg: false,
              },
            },
            result: {
              data: {
                findMyOrganizations: {
                  edges: [
                    {
                      cursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                      node: {
                        id: 'T3JnYW5pemF0aW9uczoyCg==',
                        acronym: 'ORG1',
                        name: 'organization one',
                        slug: 'organization-one',
                        domainCount: 5,
                        verified: false,
                        summaries,
                        __typename: 'Organizations',
                      },
                      __typename: 'OrganizationsEdge',
                    },
                  ],
                  pageInfo: {
                    hasNextPage: true,
                    endCursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                    hasPreviousPage: false,
                    startCursor: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                    __typename: 'PageInfo',
                  },
                  __typename: 'OrganizationsConnection',
                },
              },
            },
          },
          {
            request: {
              query: PAGINATED_ORGANIZATIONS,
              variables: {
                first: 10,
                after: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
                field: 'NAME',
                direction: 'ASC',
                search: '',
                includeSuperAdminOrg: false,
              },
            },
            result: {
              data: {
                findMyOrganizations: {
                  edges: [
                    {
                      cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                      node: {
                        id: 'T3JnYW5pemF0aW9uczoxCg==',
                        acronym: 'ORG2',
                        name: 'organization two',
                        slug: 'organization-two',
                        domainCount: 5,
                        verified: false,
                        summaries,
                        __typename: 'Organizations',
                      },
                      __typename: 'OrganizationsEdge',
                    },
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    hasPreviousPage: true,
                    startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    __typename: 'PageInfo',
                  },
                  __typename: 'OrganizationsConnection',
                },
              },
            },
          },
        ]

        const cache = createCache()

        const history = createMemoryHistory({
          initialEntries: ['/organizations'],
          initialIndex: 0,
        })

        const { getByText } = render(
          <MockedProvider mocks={mocks} cache={cache}>
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
                    <Switch>
                      <Route
                        path="/organizations"
                        render={() => <Organizations />}
                      />
                    </Switch>
                  </Router>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        await waitFor(() =>
          expect(getByText(/organization one/)).toBeInTheDocument(),
        )

        const next = await waitFor(() => getByText('Next'))

        fireEvent.click(next)

        await waitFor(() =>
          expect(getByText(/organization two/)).toBeInTheDocument(),
        )

        const previous = await waitFor(() => getByText('Previous'))

        fireEvent.click(previous)

        await waitFor(() =>
          expect(getByText(/organization one/)).toBeInTheDocument(),
        )
      })
    })

    describe(`when the "next" button is clicked`, () => {
      it('displays the next pagination result', async () => {
        const cache = createCache()
        cache.writeQuery({
          query: PAGINATED_ORGANIZATIONS,
          variables: {
            first: 10,
            field: 'NAME',
            direction: 'ASC',
            search: '',
            includeSuperAdminOrg: false,
          },
          data: {
            findMyOrganizations: {
              edges: [
                {
                  cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  node: {
                    id: 'T3JnYW5pemF0aW9uczoyCg==',
                    acronym: 'ORG1',
                    name: 'organization one',
                    slug: 'organization-one',
                    domainCount: 5,
                    verified: false,
                    summaries,
                    __typename: 'Organizations',
                  },
                  __typename: 'OrganizationsEdge',
                },
              ],
              pageInfo: {
                hasNextPage: true,
                endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                hasPreviousPage: false,
                startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                __typename: 'PageInfo',
              },
              __typename: 'OrganizationsConnection',
            },
          },
        })

        const mocks = [
          {
            request: {
              query: PAGINATED_ORGANIZATIONS,
              variables: {
                first: 10,
                field: 'NAME',
                direction: 'ASC',
                search: '',
                includeSuperAdminOrg: false,
              },
            },
            result: {
              data: {
                findMyOrganizations: {
                  edges: [
                    {
                      cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                      node: {
                        id: 'T3JnYW5pemF0aW9uczoyCg==',
                        acronym: 'ORG1',
                        name: 'organization one',
                        slug: 'organization-one',
                        domainCount: 5,
                        verified: false,
                        summaries,
                        __typename: 'Organizations',
                      },
                      __typename: 'OrganizationsEdge',
                    },
                  ],
                  pageInfo: {
                    hasNextPage: true,
                    endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    hasPreviousPage: false,
                    startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    __typename: 'PageInfo',
                  },
                  __typename: 'OrganizationsConnection',
                },
              },
            },
          },
          {
            request: {
              query: PAGINATED_ORGANIZATIONS,
              variables: {
                first: 10,
                after: 'YXJyYXljb25uZWN0aW9uOjA=',
                field: 'NAME',
                direction: 'ASC',
                search: '',
                includeSuperAdminOrg: false,
              },
            },
            result: {
              data: {
                findMyOrganizations: {
                  edges: [
                    {
                      cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                      node: {
                        id: 'T3JnYW5pemF0aW9uczoxCg==',
                        acronym: 'ORG2',
                        name: 'organization two',
                        slug: 'organization-two',
                        domainCount: 5,
                        verified: false,
                        summaries,
                        __typename: 'Organizations',
                      },
                      __typename: 'OrganizationsEdge',
                    },
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    hasPreviousPage: true,
                    startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    __typename: 'PageInfo',
                  },
                  __typename: 'OrganizationsConnection',
                },
              },
            },
          },
          {
            request: {
              query: PAGINATED_ORGANIZATIONS,
              variables: {
                first: 10,
                after: 'YXJyYXljb25uZWN0aW9uOjA=',
                field: 'NAME',
                direction: 'ASC',
                search: '',
                includeSuperAdminOrg: false,
              },
            },
            result: {
              data: {
                findMyOrganizations: {
                  edges: [
                    {
                      cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                      node: {
                        id: 'T3JnYW5pemF0aW9uczoxCg==',
                        acronym: 'ORG2',
                        name: 'organization two',
                        slug: 'organization-two',
                        domainCount: 5,
                        verified: false,
                        summaries,
                        __typename: 'Organizations',
                      },
                      __typename: 'OrganizationsEdge',
                    },
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    hasPreviousPage: true,
                    startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    __typename: 'PageInfo',
                  },
                  __typename: 'OrganizationsConnection',
                },
              },
            },
          },
        ]

        const history = createMemoryHistory({
          initialEntries: ['/organizations'],
          initialIndex: 0,
        })

        const { queryByText } = render(
          <MockedProvider mocks={mocks} cache={cache}>
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
                    <Switch>
                      <Route
                        path="/organizations"
                        render={() => <Organizations />}
                      />
                    </Switch>
                  </Router>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        await waitFor(() =>
          expect(queryByText(/organization one/)).toBeInTheDocument(),
        )

        const next = queryByText('Next')

        fireEvent.click(next)

        await waitFor(() =>
          expect(queryByText(/organization two/)).toBeInTheDocument(),
        )
      })
    })
  })
})
