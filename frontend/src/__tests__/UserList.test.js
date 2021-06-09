import React from 'react'
import UserList from '../UserList'
import {
  UPDATE_USER_ROLE,
  INVITE_USER_TO_ORG,
  REMOVE_USER_FROM_ORG,
} from '../graphql/mutations'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { UserStateProvider } from '../UserState'
import { setupI18n } from '@lingui/core'
import { rawOrgUserListData } from '../fixtures/orgUserListData'
import { createCache } from '../client'
import { PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE as FORWARD } from '../graphql/queries'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const successMocks = [
  {
    request: {
      query: FORWARD,
      variables: { first: 10, orgSlug: 'test-org.slug', search: '' },
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
        role:
          rawOrgUserListData.findOrganizationBySlug.affiliations.edges[0].node
            .permission,
      },
    },
    result: {
      data: {
        updateUserRole: {
          result: {
            status: 'string',
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
        preferredLang: 'ENGLISH',
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
        userId:
          rawOrgUserListData.findOrganizationBySlug.affiliations.edges[0].node
            .user.id,
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

// const failMocks = [
//   {
//     request: {
//       query: FORWARD,
//       variables: { first: 10, orgSlug: 'test-org.slug' },
//     },
//     result: { data: rawOrgUserListData },
//   },
//   {
//     request: {
//       query: UPDATE_USER_ROLE,
//       variables: {
//         userName:
//           rawOrgUserListData.findOrganizationBySlug.affiliations.edges[0].node
//             .user.userName,
//         orgId: rawOrgUserListData.findOrganizationBySlug.id,
//         role:
//           rawOrgUserListData.findOrganizationBySlug.affiliations.edges[0].node
//             .permission,
//       },
//     },
//     result: {
//       data: {
//         updateUserRole: {
//           result: {
//             code: -43,
//             description: 'Hello World',
//             __typename: 'AffiliationError',
//           },
//         },
//       },
//     },
//   },
//   {
//     request: {
//       query: INVITE_USER_TO_ORG,
//       variables: {
//         userName: 'a@a.a',
//         requestedRole: 'USER',
//         orgId: 'orgID123',
//         preferredLang: 'ENGLISH',
//       },
//     },
//     result: {
//       data: {
//         inviteUserToOrg: {
//           result: {
//             code: -73,
//             description: 'Hello World',
//             __typename: 'AffiliationError',
//           },
//         },
//       },
//     },
//   },
//   {
//     request: {
//       query: REMOVE_USER_FROM_ORG,
//       variables: {
//         userId:
//           rawOrgUserListData.findOrganizationBySlug.affiliations.edges[0].node
//             .user.id,
//         orgId: rawOrgUserListData.findOrganizationBySlug.id,
//       },
//     },
//     result: {
//       data: {
//         removeUserFromOrg: {
//           result: {
//             code: -7,
//             description: 'Hello World',
//             __typename: 'AffiliationError',
//           },
//         },
//       },
//     },
//   },
// ]

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
              <MockedProvider mocks={successMocks} cache={createCache()}>
                <UserList
                  permission={'SUPER_ADMIN'}
                  usersPerPage={10}
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
    // pagination

    // edit success
    it('updateUserRole elements render', async () => {
      const {
        getAllByText,
        getByDisplayValue,
        getByText,
        findByLabelText,
        findAllByLabelText,
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
              <MockedProvider mocks={successMocks} cache={createCache()}>
                <UserList
                  permission={'SUPER_ADMIN'}
                  usersPerPage={10}
                  orgSlug={'test-org.slug'}
                  orgId={rawOrgUserListData.findOrganizationBySlug.id}
                />
              </MockedProvider>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      const leftClick = { button: 0 }

      const editUserButtons = await findAllByLabelText('userEditButton')
      fireEvent.click(editUserButtons[0], leftClick)
      await waitFor(() => {
        expect(getByText(/Edit Role/i)).toBeInTheDocument()
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
      // default `button` property for click events is set to `0` which is a left click.

      // await changes
      await waitFor(() => {
        expect(getByText(/Role updated/i)).toBeInTheDocument()
      })
    })

    // edit fail
    // it('updateUserRole elements render', async () => {
    //   const history = createMemoryHistory({
    //     initialEntries: ['/user-list'],
    //     initialIndex: 0,
    //   })

    //   const {
    //     getAllByText,
    //     getByDisplayValue,
    //     getByText,
    //     findByLabelText,
    //   } = render(
    //     <UserStateProvider
    //       initialState={{
    //         userName: 'testadmin@testemail.gc.ca',
    //         jwt: 'string',
    //         tfaSendMethod: false,
    //       }}
    //     >
    //       <ThemeProvider theme={theme}>
    //         <I18nProvider i18n={i18n}>
    //           <Router history={history}>
    //             <MockedProvider mocks={failMocks} cache={createCache()}>
    //               <UserList
    //                 permission={'SUPER_ADMIN'}
    //                 usersPerPage={10}
    //                 orgSlug={'test-org.slug'}
    //                 orgId={rawOrgUserListData.findOrganizationBySlug.id}
    //               />
    //             </MockedProvider>
    //           </Router>
    //         </I18nProvider>
    //       </ThemeProvider>
    //     </UserStateProvider>,
    //   )

    //   const leftClick = { button: 0 }

    //   const editUserButton = await findByLabelText('userEditButton')
    //   fireEvent.click(editUserButton, leftClick)
    //   await waitFor(() => {
    //     expect(getByText(/Edit Role/i)).toBeInTheDocument()
    //   })

    //   const userRole = await findByLabelText(/Role:/i)
    //   await waitFor(() => {
    //     expect(userRole.type).toEqual('select-one')
    //   })

    //   // change input on select to ADMIN
    //   fireEvent.change(userRole, { target: { value: 'ADMIN' } })

    //   await waitFor(() => {
    //     const newRole = getByDisplayValue(/ADMIN/i)
    //     expect(newRole.type).toEqual('select-one')
    //   })

    //   // Apply changes button
    //   const updateButton = await waitFor(() => getAllByText(/Confirm/i))

    //   fireEvent.click(updateButton[0], leftClick)
    //   // default `button` property for click events is set to `0` which is a left click.

    //   // await changes
    //   await waitFor(() => {
    //     expect(getByText(/Unable to update user role./i)).toBeInTheDocument()
    //   })
    // })

    // add user
    it('successfully invites user to org', async () => {
      const { getByText, getByLabelText } = render(
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
                <MockedProvider mocks={successMocks} cache={createCache()}>
                  <UserList
                    permission={'SUPER_ADMIN'}
                    usersPerPage={10}
                    orgSlug={'test-org.slug'}
                    orgId={rawOrgUserListData.findOrganizationBySlug.id}
                  />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
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
                <MockedProvider mocks={successMocks} cache={createCache()}>
                  <UserList
                    permission={'SUPER_ADMIN'}
                    usersPerPage={10}
                    orgSlug={'test-org.slug'}
                    orgId={rawOrgUserListData.findOrganizationBySlug.id}
                  />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      await waitFor(() => {
        expect(queryByText(/Invite User/)).toBeInTheDocument()
      })

      const userRemoveButtons = getAllByLabelText(/userRemoveButton/)
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
