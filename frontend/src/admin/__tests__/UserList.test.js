import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { UserList } from '../UserList'

import { UserVarProvider } from '../../utilities/userState'
import { createCache } from '../../client'
import { PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE as FORWARD } from '../../graphql/queries'
import { UPDATE_USER_ROLE, INVITE_USER_TO_ORG, REMOVE_USER_FROM_ORG } from '../../graphql/mutations'
import { rawOrgUserListData } from '../../fixtures/orgUserListData'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const successMocks = [
  {
    request: {
      query: FORWARD,
      variables: {
        first: 20,
        orgSlug: 'test-org.slug',
        search: '',
        includePending: true,
        orderBy: { direction: 'ASC', field: 'PERMISSION' },
      },
    },
    result: { data: rawOrgUserListData },
  },
  {
    request: {
      query: FORWARD,
      variables: {
        first: 20,
        orgSlug: 'test-org.slug',
        search: '',
        includePending: true,
        orderBy: { direction: 'ASC', field: 'PERMISSION' },
      },
    },
    result: { data: rawOrgUserListData },
  },
  {
    request: {
      query: UPDATE_USER_ROLE,
      variables: {
        userName: rawOrgUserListData.findOrganizationBySlug.affiliations.edges[0].node.user.userName,
        orgId: rawOrgUserListData.findOrganizationBySlug.id,
        role: 'ADMIN',
      },
    },
    result: {
      data: {
        updateUserRole: {
          result: {
            status: 'Hello World',
            __typename: 'UpdateUserRoleResult',
          },
          __typename: 'UpdateUserRolePayload',
        },
      },
    },
  },
  {
    request: {
      query: INVITE_USER_TO_ORG,
      variables: {
        userName: 'newUser@test.ca',
        requestedRole: 'USER',
        orgId: rawOrgUserListData.findOrganizationBySlug.id,
      },
    },
    result: {
      data: {
        inviteUserToOrg: {
          result: {
            status: 'Hello World',
            __typename: 'InviteUserToOrgResult',
          },
          __typename: 'InviteUserToOrgPayload',
        },
      },
    },
  },
  {
    request: {
      query: REMOVE_USER_FROM_ORG,
      variables: {
        userId: rawOrgUserListData.findOrganizationBySlug.affiliations.edges[0].node.user.id,
        orgId: rawOrgUserListData.findOrganizationBySlug.id,
      },
    },
    result: {
      data: {
        removeUserFromOrg: {
          result: {
            status: 'Hello World',
            user: {
              userName: 'Ethelyn_Senger86@hotmail.com',
              __typename: 'SharedUser',
            },
            __typename: 'RemoveUserFromOrgResult',
          },
          __typename: 'RemoveUserFromOrgPayload',
        },
      },
    },
  },
]

describe('<UserList />', () => {
  it('successfully renders with mocked data', async () => {
    const { getByText } = render(
      <MockedProvider mocks={successMocks} cache={createCache()}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']}>
                <UserList
                  includePending={true}
                  permission={'SUPER_ADMIN'}
                  orgSlug={'test-org.slug'}
                  orgId={rawOrgUserListData.findOrganizationBySlug.id}
                />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() =>
      expect(
        getByText(rawOrgUserListData.findOrganizationBySlug.affiliations.edges[0].node.user.userName),
      ).toBeInTheDocument(),
    )
  })

  describe('Admin profile userlist', () => {
    // pagination

    // edit success
    it('updateUserRole elements render', async () => {
      const { getAllByText, getByDisplayValue, getByText, findByLabelText, findAllByLabelText } = render(
        <MockedProvider mocks={successMocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <UserList
                  includePending={true}
                  permission={'SUPER_ADMIN'}
                  orgSlug={'test-org.slug'}
                  orgId={rawOrgUserListData.findOrganizationBySlug.id}
                />
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      // default `button` property for click events is set to `0` which is a left click.
      const leftClick = { button: 0 }

      const editUserButtons = await findAllByLabelText('Edit User')
      fireEvent.click(editUserButtons[0], leftClick)
      await waitFor(() => {
        expect(getByText(/Confirm/i)).toBeInTheDocument()
      })

      const userRole = await findByLabelText(/Role:/i)
      await waitFor(() => {
        expect(userRole.type).toEqual('select-one')
      })

      // change input on select to ADMIN
      fireEvent.change(userRole, { target: { value: 'ADMIN' } })

      await waitFor(() => {
        const newRole = getByDisplayValue(/ADMIN/i)
        expect(newRole.type).toEqual('select-one')
      })

      // Apply changes button
      const updateButton = await waitFor(() => getAllByText(/Confirm/i))

      fireEvent.click(updateButton[0], leftClick)

      // await changes
      await waitFor(() => {
        expect(getByText(/Role updated/i)).toBeInTheDocument()
      })
    })

    // add user
    it('successfully invites user to org', async () => {
      const { getByText, getByLabelText } = render(
        <MockedProvider mocks={successMocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']}>
                  <UserList
                    includePending={true}
                    permission={'SUPER_ADMIN'}
                    usersPerPage={10}
                    orgSlug={'test-org.slug'}
                    orgId={rawOrgUserListData.findOrganizationBySlug.id}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        const newUserInput = getByLabelText('new-user-input')
        fireEvent.change(newUserInput, { target: { value: 'newUser@test.ca' } })
      })

      await waitFor(() => {
        const newUserButton = getByText(/Invite User/)
        fireEvent.click(newUserButton)
        // expect(queryByText(/User invited/)).toBeInTheDocument()
      })
    })

    // remove user
    it('successfully removes user from org', async () => {
      const { getAllByLabelText, queryByText, getByText } = render(
        <MockedProvider mocks={successMocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']}>
                  <UserList
                    includePending={true}
                    permission={'SUPER_ADMIN'}
                    orgSlug={'test-org.slug'}
                    orgId={rawOrgUserListData.findOrganizationBySlug.id}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        expect(queryByText(/Garland.Hudson@yahoo.com/)).toBeInTheDocument()
      })

      const userRemoveButtons = getAllByLabelText(/Remove User/)
      fireEvent.click(userRemoveButtons[0])

      await waitFor(() => {
        expect(queryByText(/Remove User/)).toBeInTheDocument()
        const confirmButton = getByText('Confirm')
        fireEvent.click(confirmButton)
      })

      // await waitFor(() => {
      //   expect(queryByText(/User removed./)).toBeInTheDocument()
      // })
    })
  })
})
