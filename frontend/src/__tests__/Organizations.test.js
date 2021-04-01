import React from 'react'
import { createMemoryHistory } from 'history'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { Router, Route, Switch, MemoryRouter } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import Organizations from '../Organizations'
import { PAGINATED_ORGANIZATIONS } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { createCache } from '../client'

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
              first: 2,
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
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={['/organizations']}
                initialIndex={0}
              >
                <MockedProvider mocks={mocks} cache={createCache()}>
                  <Organizations orgsPerPage={2} />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
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
              first: 1,
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
              first: 1,
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
              first: 1,
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

      const { getAllByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MockedProvider mocks={mocks} cache={createCache()}>
                <Router history={history}>
                  <Switch>
                    <Route
                      path="/organizations"
                      render={() => <Organizations orgsPerPage={1} />}
                    />
                  </Switch>
                </Router>
              </MockedProvider>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      const orgCards = await waitFor(() => getAllByText(/organization one/i))
      const leftClick = { button: 0 }
      fireEvent.click(orgCards[0], leftClick)

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
                first: 1,
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
                first: 1,
                after: 'Y3Vyc29yOnYyOpHOAAfgfQ==',
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

        const cache = createCache()

        const history = createMemoryHistory({
          initialEntries: ['/organizations'],
          initialIndex: 0,
        })

        const { getByText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MockedProvider mocks={mocks} cache={cache}>
                  <Router history={history}>
                    <Switch>
                      <Route
                        path="/organizations"
                        render={() => <Organizations orgsPerPage={1} />}
                      />
                    </Switch>
                  </Router>
                </MockedProvider>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
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
          variables: { first: 1, field: 'NAME', direction: 'ASC', search: '' },
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
              variables: { first: 1, search: '' },
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
                first: 1,
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
                first: 1,
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

        const { queryByText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MockedProvider mocks={mocks} cache={cache}>
                  <Router history={history}>
                    <Switch>
                      <Route
                        path="/organizations"
                        render={() => <Organizations orgsPerPage={1} />}
                      />
                    </Switch>
                  </Router>
                </MockedProvider>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
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
