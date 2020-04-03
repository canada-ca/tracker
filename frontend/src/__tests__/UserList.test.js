import React from 'react'
import { UserList } from '../UserList'
import { i18n } from '@lingui/core'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'

import { QUERY_USERLIST } from '../graphql/queries'

describe('<UserList />', () => {
  afterEach(cleanup)

  it('renders', async () => {
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
    expect(container).toBeTruthy()
  })

  it('the component renders correctly with mocked data', async () => {
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
    const { container } = render(
      <MockedProvider mocks={mocks} addTypename={false} removeTypename>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <UserList />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )
    expect(container).toBeTruthy()

    // TODO: Write test for this.
  })
})
