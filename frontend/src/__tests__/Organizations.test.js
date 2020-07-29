import React from 'react'
import { createMemoryHistory } from 'history'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { Router, Route, Switch, MemoryRouter } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import Organizations from '../Organizations'
import {
  PAGINATED_ORGANIZATIONS,
  REVERSE_PAGINATED_ORGANIZATIONS,
} from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { createCache } from '../client'

describe('<Organisations />', () => {
  describe('given a list of organizations', () => {
    xit('displays a list of organizations', async () => {
      const mocks = [
        {
          request: {
            query: PAGINATED_ORGANIZATIONS,
            variables: { after: '', first: 2 },
          },
          result: {
            data: {
              organizations: {
                edges: [
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    node: {
                      id: 'T3JnYW5pemF0aW9uczoyCg==',
                      acronym: 'ORG1',
                      name: 'organization one',
                      slug: 'organization-one',
                      domainCount: 5,
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
          initialState={{ userName: null, jwt: null, tfa: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
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

    xit('navigates to an organization detail page when a link is clicked', async () => {
      const mocks = [
        {
          request: {
            query: PAGINATED_ORGANIZATIONS,
            variables: { after: '', first: 1 },
          },
          result: {
            data: {
              organizations: {
                edges: [
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    node: {
                      id: 'T3JnYW5pemF0aW9uczoyCg==',
                      acronym: 'ORG1',
                      name: 'organization one',
                      slug: 'organization-one',
                      domainCount: 5,
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
            variables: { after: 'YXJyYXljb25uZWN0aW9uOjA=', first: 1 },
          },
          result: {
            data: {
              organizations: {
                edges: [
                  {
                    cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                    node: {
                      id: 'T3JnYW5pemF0aW9uczoxCg==',
                      acronym: 'ORG2',
                      name: 'organization two',
                      slug: 'organization-two',
                      domainCount: 5,
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

      const { getByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfa: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
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

      const link = await waitFor(() => getByText(/organization one/i))
      await waitFor(() => {
        fireEvent.click(link)
      })

      await waitFor(() =>
        expect(history.location.pathname).toEqual(
          '/organizations/organization-one',
        ),
      )
    })
  })
})
