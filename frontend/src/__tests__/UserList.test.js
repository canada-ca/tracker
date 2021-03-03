import React from 'react'
import UserList from '../UserList'
import { UPDATE_USER_ROLE } from '../graphql/mutations'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Router } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { createMemoryHistory } from 'history'
import { MockedProvider } from '@apollo/client/testing'
import { UserStateProvider } from '../UserState'
import { setupI18n } from '@lingui/core'
import { rawOrgUserListData } from '../fixtures/orgUserListData'
import { createCache } from '../client'
import { PAGINATED_ORG_AFFILIATIONS as FORWARD } from '../graphql/queries'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const mocks = [
  {
    request: {
      query: FORWARD,
      variables: { first: 4, orgSlug: 'test-org.slug' },
    },
    result: { data: rawOrgUserListData },
  },
  {
    request: {
      query: UPDATE_USER_ROLE,
      variables: {
        userName:
          rawOrgUserListData.findOrganizationBySlug.affiliations.edges[0].node
            .user.userName,
        orgId: rawOrgUserListData.findOrganizationBySlug.id,
        role: 'SUPER_ADMIN',
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

describe('<UserList />', () => {
  it('successfully renders with mocked data', async () => {
    const { getByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'testuser@testemail.gc.ca',
          jwt: 'string',
          tfaSendMethod: false,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']}>
              <MockedProvider mocks={mocks} cache={createCache()}>
                <UserList
                  permission={'SUPER_ADMIN'}
                  usersPerPage={4}
                  orgSlug={'test-org.slug'}
                  orgId={rawOrgUserListData.findOrganizationBySlug.id}
                />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() =>
      expect(
        getByText(
          rawOrgUserListData.findOrganizationBySlug.affiliations.edges[0].node
            .user.userName,
        ),
      ).toBeInTheDocument(),
    )
  })

  describe('Admin profile userlist', () => {
    it('updateUserRole elements render', async () => {
      const history = createMemoryHistory({
        initialEntries: ['/user-list'],
        initialIndex: 0,
      })

      const {
        getAllByText,
        getByDisplayValue,
        getByText,
        findByLabelText,
      } = render(
        <UserStateProvider
          initialState={{
            userName: 'testadmin@testemail.gc.ca',
            jwt: 'string',
            tfaSendMethod: false,
          }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <Router history={history}>
                <MockedProvider mocks={mocks} cache={createCache()}>
                  <UserList
                    permission={'SUPER_ADMIN'}
                    usersPerPage={4}
                    orgSlug={'test-org.slug'}
                    orgId={rawOrgUserListData.findOrganizationBySlug.id}
                  />
                </MockedProvider>
              </Router>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      const userRole = await findByLabelText(/Role:/i)
      // const userRole = await findByText('Role:')
      await waitFor(() => {
        expect(userRole.type).toEqual('select-one')
      })

      // change input on select to ADMIN
      fireEvent.change(userRole, { target: { value: 'SUPER_ADMIN' } })

      await waitFor(() => {
        const newRole = getByDisplayValue(/ADMIN/i)
        expect(newRole.type).toEqual('select-one')
      })

      // Apply changes button
      const updateButton = await waitFor(() => getAllByText(/Apply/i))

      const leftClick = { button: 0 }
      fireEvent.click(updateButton[0], leftClick)
      // default `button` property for click events is set to `0` which is a left click.

      // await changes
      await waitFor(() => {
        expect(getByText(/Role updated/i)).toBeInTheDocument()
      })
    })
  })
})
