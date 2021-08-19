import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { theme, ChakraProvider, useDisclosure } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { UserList } from '../UserList'

import { UserVarProvider } from '../../utilities/userState'
import { createCache } from '../../client'
import { PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE as FORWARD } from '../../graphql/queries'
import {
  UPDATE_USER_ROLE,
  INVITE_USER_TO_ORG,
  REMOVE_USER_FROM_ORG,
} from '../../graphql/mutations'
import { rawOrgUserListData } from '../../fixtures/orgUserListData'
import { UserListModal } from '../UserListModal'
import userEvent from '@testing-library/user-event'
import canada from '../../theme/canada'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const orgId = 'test-id'
const editingUserName = 'test-username@email.com'
const orgSlug = 'test-org-slug'

// eslint-disable-next-line react/prop-types
const UserListModalExample = ({ mutation, permission, editingUserRole }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <button onClick={onOpen}>Open Modal</button>
      <UserListModal
        isOpen={isOpen}
        onClose={onClose}
        orgId={orgId}
        editingUserName={editingUserName}
        editingUserRole={editingUserRole}
        orgSlug={orgSlug}
        permission={permission}
        mutation={mutation}
      />
    </>
  )
}

describe('<UserListModal />', () => {
  it('can be opened and closed', async () => {
    const { getByRole, queryByText } = render(
      <MockedProvider cache={createCache()}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']}>
                <UserListModalExample
                  mutation="update"
                  permission="ADMIN"
                  editingUserRole="USER"
                />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    // modal closed
    const openModalButton = getByRole('button', { name: /Open Modal/ })
    expect(queryByText(/test-username/)).not.toBeInTheDocument()

    // modal opened
    userEvent.click(openModalButton)

    await waitFor(() => {
      expect(queryByText(/test-username/)).toBeVisible()
    })
    const closeModalButton = getByRole('button', { name: /Close/ })

    // modal closed
    userEvent.click(closeModalButton)

    await waitFor(() =>
      expect(queryByText(/test-username/)).not.toBeInTheDocument(),
    )
  })

  describe('admin is updating a user', () => {
    describe('admin has "ADMIN" privileges', () => {
      describe('admin is updating user with "USER" privileges', () => {
        it('admin can change user role to "ADMIN"', async () => {
          const mocks = [
            {
              request: {
                query: UPDATE_USER_ROLE,
                variables: {
                  orgId: orgId,
                  role: 'ADMIN',
                  userName: editingUserName,
                },
              },
              result: {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully',
                      __typename: 'UpdateUserRoleResult',
                    },
                    __typename: 'UpdateUserRolePayload',
                  },
                },
              },
            },
          ]

          const { getByText, getByRole, queryByText } = render(
            <MockedProvider mocks={mocks} cache={createCache()}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={canada}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']}>
                      <UserListModalExample
                        mutation="update"
                        editingUserRole="USER"
                        permission="ADMIN"
                      />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )

          // modal closed
          const openModalButton = getByRole('button', { name: /Open Modal/ })
          expect(queryByText(/test-username/)).not.toBeInTheDocument()

          // modal opened
          userEvent.click(openModalButton)

          // get select element, verify options
          const roleChangeSelect = getByRole('combobox', {
            name: /Role:/,
          })
          expect(roleChangeSelect.options.length).toEqual(2)
          expect(Object.values(roleChangeSelect.options)[0]).toHaveTextContent(
            /USER/,
          )
          expect(Object.values(roleChangeSelect.options)[1]).toHaveTextContent(
            /ADMIN/,
          )

          // select new role and update
          userEvent.selectOptions(roleChangeSelect, 'ADMIN')
          const confirmUserUpdateButton = getByRole('button', {
            name: /Confirm/i,
          })
          userEvent.click(confirmUserUpdateButton)

          // check for "success" toast
          await waitFor(() => {
            expect(
              getByText(/The user's role has been successfully updated/),
            ).toBeVisible()
          })
        })
        it('admin can not change user role to "SUPER_ADMIN"', async () => {
          const { getByRole, queryByText } = render(
            <MockedProvider mocks={[]} cache={createCache()}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={canada}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']}>
                      <UserListModalExample
                        mutation="update"
                        editingUserRole="USER"
                        permission="ADMIN"
                      />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )

          // modal closed
          const openModalButton = getByRole('button', { name: /Open Modal/ })
          expect(queryByText(/test-username/)).not.toBeInTheDocument()

          // modal opened
          userEvent.click(openModalButton)

          // get select element, verify options
          const roleChangeSelect = getByRole('combobox', {
            name: /Role:/,
          })
          expect(roleChangeSelect.options.length).toEqual(2)
          expect(Object.values(roleChangeSelect.options)[0]).toHaveTextContent(
            /USER/,
          )
          expect(Object.values(roleChangeSelect.options)[1]).toHaveTextContent(
            /ADMIN/,
          )
          expect(roleChangeSelect).not.toHaveTextContent(/SUPER_ADMIN/)
        })
      })
      describe('admin is updating user with "ADMIN" privileges', () => {
        it('admin cannot downgrade user to "USER"', async () => {
          const { getByRole, queryByText } = render(
            <MockedProvider mocks={[]} cache={createCache()}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={canada}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']}>
                      <UserListModalExample
                        mutation="update"
                        editingUserRole="ADMIN"
                        permission="ADMIN"
                      />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )

          // modal closed
          const openModalButton = getByRole('button', { name: /Open Modal/ })
          expect(queryByText(/test-username/)).not.toBeInTheDocument()

          // modal opened
          userEvent.click(openModalButton)

          // get select element, verify options
          const roleChangeSelect = getByRole('combobox', {
            name: /Role:/,
          })
          expect(roleChangeSelect.options.length).toEqual(1)
          expect(Object.values(roleChangeSelect.options)[0]).toHaveTextContent(
            /ADMIN/,
          )
          expect(roleChangeSelect).not.toHaveTextContent(/USER/)
        })
      })
    })
    describe('admin has "SUPER_ADMIN" privileges', () => {
      describe('admin is updating user with "USER" privileges', () => {
        it('admin can change user role to "ADMIN"', async () => {
          const mocks = [
            {
              request: {
                query: UPDATE_USER_ROLE,
                variables: {
                  orgId: orgId,
                  role: 'ADMIN',
                  userName: editingUserName,
                },
              },
              result: {
                data: {
                  updateUserRole: {
                    result: {
                      status: 'User role was updated successfully',
                      __typename: 'UpdateUserRoleResult',
                    },
                    __typename: 'UpdateUserRolePayload',
                  },
                },
              },
            },
          ]

          const { getByText, getByRole, queryByText } = render(
            <MockedProvider mocks={mocks} cache={createCache()}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={canada}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']}>
                      <UserListModalExample
                        mutation="update"
                        editingUserRole="USER"
                        permission="SUPER_ADMIN"
                      />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )

          // modal closed
          const openModalButton = getByRole('button', { name: /Open Modal/ })
          expect(queryByText(/test-username/)).not.toBeInTheDocument()

          // modal opened
          userEvent.click(openModalButton)

          // get select element, verify options
          const roleChangeSelect = getByRole('combobox', {
            name: /Role:/,
          })
          expect(roleChangeSelect.options.length).toEqual(2)
          expect(Object.values(roleChangeSelect.options)[0]).toHaveTextContent(
            /USER/,
          )
          expect(Object.values(roleChangeSelect.options)[1]).toHaveTextContent(
            /ADMIN/,
          )

          // select new role and update
          userEvent.selectOptions(roleChangeSelect, 'ADMIN')
          const confirmUserUpdateButton = getByRole('button', {
            name: /Confirm/i,
          })
          userEvent.click(confirmUserUpdateButton)

          // check for "success" toast
          await waitFor(() => {
            expect(
              getByText(/The user's role has been successfully updated/),
            ).toBeVisible()
          })
        })
        it('admin can not change user role to "SUPER_ADMIN"', async () => {
          const { getByRole, queryByText } = render(
            <MockedProvider mocks={[]} cache={createCache()}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={canada}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']}>
                      <UserListModalExample
                        mutation="update"
                        editingUserRole="USER"
                        permission="SUPER_ADMIN"
                      />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )

          // modal closed
          const openModalButton = getByRole('button', { name: /Open Modal/ })
          expect(queryByText(/test-username/)).not.toBeInTheDocument()

          // modal opened
          userEvent.click(openModalButton)

          // get select element, verify options
          const roleChangeSelect = getByRole('combobox', {
            name: /Role:/,
          })
          expect(roleChangeSelect.options.length).toEqual(2)
          expect(Object.values(roleChangeSelect.options)[0]).toHaveTextContent(
            /USER/,
          )
          expect(Object.values(roleChangeSelect.options)[1]).toHaveTextContent(
            /ADMIN/,
          )
          expect(roleChangeSelect).not.toHaveTextContent(/SUPER_ADMIN/)
        })
      })
    })
  })
  describe('admin is adding a new user', () => {
    describe('admin has "ADMIN" privileges', () => {
      it('admin can add a user with "USER" privileges', async () => {
        const mocks = [
          {
            request: {
              query: INVITE_USER_TO_ORG,
              variables: {
                orgId: orgId,
                requestedRole: 'USER',
                userName: editingUserName,
                preferredLang: 'ENGLISH',
              },
            },
            result: {
              data: {
                inviteUserToOrg: {
                  result: {
                    status: 'User successfully invited',
                    __typename: 'InviteUserToOrgResult',
                  },
                  __typename: 'InviteUserToOrgPayload',
                },
              },
            },
          },
        ]

        const { getByText, getByRole, queryByText } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <ChakraProvider theme={canada}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/']}>
                    <UserListModalExample
                      mutation="create"
                      permission="ADMIN"
                      editingUserRole="USER"
                    />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        // modal closed
        const openModalButton = getByRole('button', { name: /Open Modal/ })
        expect(queryByText(/test-username/)).not.toBeInTheDocument()

        // modal opened
        userEvent.click(openModalButton)

        // get select element, verify options
        const newUserRoleSelect = getByRole('combobox', {
          name: /Role:/,
        })

        expect(newUserRoleSelect.options.length).toEqual(2)
        expect(Object.values(newUserRoleSelect.options)[0]).toHaveTextContent(
          /USER/,
        )
        expect(Object.values(newUserRoleSelect.options)[1]).toHaveTextContent(
          /ADMIN/,
        )

        const confirmUserInviteButton = getByRole('button', {
          name: /Confirm/i,
        })
        userEvent.click(confirmUserInviteButton)

        // check for "success" toast
        await waitFor(() => {
          expect(getByText(/Email invitation sent/)).toBeVisible()
        })
      })
    })
    it('admin can add a user with "ADMIN" privileges', async () => {
      const mocks = [
        {
          request: {
            query: INVITE_USER_TO_ORG,
            variables: {
              orgId: orgId,
              requestedRole: 'ADMIN',
              userName: editingUserName,
              preferredLang: 'ENGLISH',
            },
          },
          result: {
            data: {
              inviteUserToOrg: {
                result: {
                  status: 'User successfully invited',
                  __typename: 'InviteUserToOrgResult',
                },
                __typename: 'InviteUserToOrgPayload',
              },
            },
          },
        },
      ]

      const { getByText, getByRole, queryByText } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={canada}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']}>
                  <UserListModalExample
                    mutation="create"
                    permission="ADMIN"
                    editingUserRole="USER"
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      // modal closed
      const openModalButton = getByRole('button', { name: /Open Modal/ })
      expect(queryByText(/test-username/)).not.toBeInTheDocument()

      // modal opened
      userEvent.click(openModalButton)

      // get select element, verify options
      const newUserRoleSelect = getByRole('combobox', {
        name: /Role:/,
      })

      expect(newUserRoleSelect.options.length).toEqual(2)
      expect(Object.values(newUserRoleSelect.options)[0]).toHaveTextContent(
        /USER/,
      )
      expect(Object.values(newUserRoleSelect.options)[1]).toHaveTextContent(
        /ADMIN/,
      )
      userEvent.selectOptions(newUserRoleSelect, 'ADMIN')

      const confirmUserInviteButton = getByRole('button', {
        name: /Confirm/i,
      })
      userEvent.click(confirmUserInviteButton)

      // check for "success" toast
      await waitFor(() => {
        expect(getByText(/Email invitation sent/)).toBeVisible()
      })
    })
  })
})
