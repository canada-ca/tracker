import React from 'react'
import UserList from '../UserList'
import { UPDATE_USER_ROLES } from '../graphql/mutations'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Router } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { createMemoryHistory } from 'history'
import { MockedProvider } from '@apollo/client/testing'
import { UserStateProvider } from '../UserState'
import { setupI18n } from '@lingui/core'

describe('<UserList />', () => {
  const data = {
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
    },
    edges: [
      {
        node: {
          id: 'VXNlckxpc3RJdGVtOigzLCAyKQ==',
          userName: 'testuser@testemail.gc.ca',
          admin: true,
          tfa: false,
          displayName: 'Test User Esq.',
        },
      },
    ],
  }

  it('successfully renders with mocked data', async () => {
    // Set the inital history item to user-list
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'testuser@testemail.gc.ca',
          jwt: 'string',
          tfa: false,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']}>
              <MockedProvider>
                <UserList userListData={data} />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    //
    // Get all of the mocked user cards, and expect there to be only one entry.
    await waitFor(() => {
      const userCards = getAllByText('testuser@testemail.gc.ca')
      expect(userCards).toHaveLength(1)
    })
  })

  it('redirects to userPage when a list element is clicked', async () => {
    // create a history object and inject it so we can inspect it afterwards
    // for the side effects of our form submission (a redirect to /!).
    const history = createMemoryHistory({
      initialEntries: ['/user-list'],
      initialIndex: 0,
    })

    // Set the inital history item to user-list
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'testuser@testemail.gc.ca',
          jwt: 'string',
          tfa: false,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <Router history={history}>
              <MockedProvider>
                <UserList userListData={data} />
              </MockedProvider>
            </Router>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
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

  describe('Admin profile userlist', () => {
    it('updateUserRole elements render', async () => {
      const history = createMemoryHistory({
        initialEntries: ['/user-list'],
        initialIndex: 0,
      })

      const mocks = [
        {
          request: {
            query: UPDATE_USER_ROLES,
            variables: {
              input: {
                orgSlug: 'test-org-slug',
                role: 'USER_WRITE',
                userName: 'testuser@testemail.gc.ca',
              },
            },
          },
          result: {
            data: {
              updateUserRole: {
                status: 'string',
              },
            },
          },
        },
      ]

      const { getAllByText, getByDisplayValue, getByText } = render(
        <UserStateProvider
          initialState={{
            userName: 'testadmin@testemail.gc.ca',
            jwt: 'string',
            tfa: false,
          }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
              <Router history={history}>
                <MockedProvider mocks={mocks} addTypename={false}>
                  <UserList
                    userListData={data}
                    permission="SUPER_ADMIN"
                    orgSlug="test-org-slug"
                  />
                </MockedProvider>
              </Router>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      const userRole = getByDisplayValue(/READ/i)
      await waitFor(() => {
        expect(userRole.type).toEqual('select-one')
      })

      // change input on select to WRITE
      fireEvent.change(userRole, { target: { value: 'USER_WRITE' } })

      await waitFor(() => {
        const newRole = getByDisplayValue(/WRITE/i)
        expect(newRole.type).toEqual('select-one')
      })

      // Apply changes button
      const updateButton = await waitFor(() => getAllByText(/Apply/i))
      expect(updateButton).toHaveLength(1)

      const leftClick = { button: 0 }
      fireEvent.click(updateButton[0], leftClick)
      // default `button` property for click events is set to `0` which is a left click.

      // await changes
      await waitFor(() => {
        const newRole = getByText(/Role updated/i)
        expect(newRole).toBeInTheDocument()
      })
    })
  })
})
