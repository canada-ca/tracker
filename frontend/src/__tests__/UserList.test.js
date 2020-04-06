import React from 'react'
import { UserList } from '../UserList'
import { i18n } from '@lingui/core'
import {
  render,
  cleanup,
  waitForElementToBeRemoved,
  fireEvent,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, Router } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'
import { createMemoryHistory } from 'history'

import { QUERY_USERLIST } from '../graphql/queries'

// If this unused import, the mocked data test fails.  VERY weird.
import App from '../App'

describe('<UserList />', () => {
  afterEach(cleanup)

  it('successfully renders', async () => {
    const { container } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <UserList />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )
    expect(container).toBeDefined()
  })

  it('successfully renders with mocked data', async () => {
    const mocks = [
      {
        request: {
          query: QUERY_USERLIST,
        },
        result: {
          data: {
            user: {
              affiliations: {
                edges: [
                  {
                    node: {
                      organization: {
                        acronym: 'TEST',
                        affiliatedUsers: {
                          pageInfo: {
                            hasNextPage: true,
                            hasPreviousPage: true,
                            startCursor: 'string',
                            endCursor: 'string',
                          },
                          edges: [
                            {
                              node: {
                                id: 'NzYzMzQ1MzQ1Ng==',
                                user: {
                                  userName: 'testuser@testemail.ca',
                                  displayName: 'Test User',
                                  tfa: false,
                                  affiliations: {
                                    edges: [
                                      {
                                        node: {
                                          id: 'ODAyOTY1MDMyMQ==',
                                          organization: {
                                            acronym: 'GC',
                                          },
                                          permission: 'SUPER_ADMIN',
                                        },
                                      },
                                      {
                                        node: {
                                          id: 'NjI3NzcyNDQ=',
                                          organization: {
                                            acronym: 'BC',
                                          },
                                          permission: 'USER_WRITE',
                                        },
                                      },
                                      {
                                        node: {
                                          id: 'NjkyMzAyOTAx',
                                          organization: {
                                            acronym: 'BC',
                                          },
                                          permission: 'ADMIN',
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]
    // Set the inital history item to user-list
    const { container, queryAllByRole, getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <UserList />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(container).toBeDefined()

    expect(getByText('Loading...')).toBeInTheDocument()
    const loadingElement = getByText('Loading...')

    await waitForElementToBeRemoved(loadingElement).then(() =>
      console.log('Element no longer in DOM'),
    )

    // Get all of the mocked user cards, and expect there to be only one entry.
    const userCards = queryAllByRole('userCard')
    expect(userCards).toHaveLength(1)
  })

  it('redirects to userPage when a list element is clicked', async () => {
    const mocks = [
      {
        request: {
          query: QUERY_USERLIST,
        },
        result: {
          data: {
            user: {
              affiliations: {
                edges: [
                  {
                    node: {
                      organization: {
                        acronym: 'TEST',
                        affiliatedUsers: {
                          pageInfo: {
                            hasNextPage: true,
                            hasPreviousPage: true,
                            startCursor: 'string',
                            endCursor: 'string',
                          },
                          edges: [
                            {
                              node: {
                                id: 'NzYzMzQ1MzQ1Ng==',
                                user: {
                                  userName: 'testuser@testemail.ca',
                                  displayName: 'Test User',
                                  tfa: false,
                                  affiliations: {
                                    edges: [
                                      {
                                        node: {
                                          id: 'ODAyOTY1MDMyMQ==',
                                          organization: {
                                            acronym: 'GC',
                                          },
                                          permission: 'SUPER_ADMIN',
                                        },
                                      },
                                      {
                                        node: {
                                          id: 'NjI3NzcyNDQ=',
                                          organization: {
                                            acronym: 'BC',
                                          },
                                          permission: 'USER_WRITE',
                                        },
                                      },
                                      {
                                        node: {
                                          id: 'NjkyMzAyOTAx',
                                          organization: {
                                            acronym: 'BC',
                                          },
                                          permission: 'ADMIN',
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]

    // create a history object and inject it so we can inspect it afterwards
    // for the side effects of our form submission (a redirect to /!).
    const history = createMemoryHistory({
      initialEntries: ['user-list'],
      initialIndex: 0,
    })

    // Set the inital history item to user-list
    const { container, queryAllByRole, getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <Router history={history}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <UserList />
            </MockedProvider>
          </Router>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(container).toBeDefined()

    expect(getByText('Loading...')).toBeInTheDocument()
    const loadingElement = getByText('Loading...')

    await waitForElementToBeRemoved(loadingElement).then(() =>
      console.log('Element no longer in DOM'),
    )

    // Get all of the mocked user cards, and expect there to be only one entry.
    const userCards = queryAllByRole('userCard')
    expect(userCards).toHaveLength(1)

    const leftClick = { button: 0 }
    fireEvent.click(userCards[0], leftClick)
    // default `button` property for click events is set to `0` which is a left click.

    await waitFor(() => {
      // Path should be '/user', so expect that value
      expect(history.location.pathname).toEqual('/user')
    })
  })
})
