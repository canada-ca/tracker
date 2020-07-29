import React from 'react'
import { createMemoryHistory } from 'history'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { Router, Route, Switch } from 'react-router-dom'
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
  describe('pagination', () => {
    const cache = createCache()
    cache.writeQuery({
      query: PAGINATED_ORGANIZATIONS,
      variables: { after: '', first: 1 },
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
    })
    cache.writeQuery({
      query: PAGINATED_ORGANIZATIONS,
      variables: { after: 'YXJyYXljb25uZWN0aW9uOjA=', first: 1 },
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
    })

    describe(`when the "previous" button is clicked`, () => {
      it('displays the previous pagination result', async () => {
        const mocks = [
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
          {
            request: {
              query: REVERSE_PAGINATED_ORGANIZATIONS,
              variables: { before: 'YXJyYXljb25uZWN0aW9uOjA=', last: 1 },
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

        await waitFor(() => {
          fireEvent.click(next)
        })

        await waitFor(() =>
          expect(getByText(/organization two/)).toBeInTheDocument(),
        )

        const previous = await waitFor(() => getByText('Previous'))
        await waitFor(() => {
          fireEvent.click(previous)
        })

        await waitFor(() =>
          expect(getByText(/organization one/)).toBeInTheDocument(),
        )
      })
    })
  })
})
