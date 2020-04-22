import React from 'react'
import UserList from '../UserList'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Router } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'
import { createMemoryHistory } from 'history'
import { QUERY_USERLIST } from '../graphql/queries'
import { setupI18n } from '@lingui/core'

describe('<UserList />', () => {
  it('successfully renders with mocked data', async () => {
    const mocks = [
      {
        request: {
          query: QUERY_USERLIST,
        },
        result: {
          data: {
            userList: {
              organization: 'TEST',
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
              },
              edges: [
                {
                  node: {
                    id: 'ODY0MDEzMTE1NA==',
                    userName: 'testuser@testemail.gc.ca',
                    admin: false,
                    tfa: false,
                    displayName: 'Test User',
                  },
                },
              ],
            },
          },
        },
      },
    ]

    // Set the inital history item to user-list
    const { getAllByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <MemoryRouter initialEntries={['/']}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <UserList />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )

    //
    // Get all of the mocked user cards, and expect there to be only one entry.
    await waitFor(() => {
      const userCards = getAllByText('testuser@testemail.gc.ca')
      expect(userCards).toHaveLength(1)
    })
  })

  it('redirects to userPage when a list element is clicked', async () => {
    const mocks = [
      {
        request: {
          query: QUERY_USERLIST,
        },
        result: {
          data: {
            userList: {
              organization: 'TEST',
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: true,
              },
              edges: [
                {
                  node: {
                    id: 'ODY0MDEzMTE1NA==',
                    userName: 'testuser@testemail.gc.ca',
                    admin: false,
                    tfa: false,
                    displayName: 'Test User',
                  },
                },
              ],
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
    const { getAllByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <Router history={history}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <UserList />
            </MockedProvider>
          </Router>
        </I18nProvider>
      </ThemeProvider>,
    )

    // Get all of the mocked user cards, and expect there to be only one entry.
    const userCards = await waitFor(() =>
      getAllByText('testuser@testemail.gc.ca'),
    )
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
