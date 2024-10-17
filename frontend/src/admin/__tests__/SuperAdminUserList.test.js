import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { SuperAdminUserList } from '../SuperAdminUserList'

import { UserVarProvider } from '../../utilities/userState'
import { createCache } from '../../client'
import { FIND_MY_USERS } from '../../graphql/queries'
import { UPDATE_USER_ROLE, REMOVE_USER_FROM_ORG } from '../../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const saUserListMockData = {
  data: {
    findMyUsers: {
      edges: [
        {
          cursor: 'Hello World',
          node: {
            id: '39b345c9-55c6-4d0d-83e3-c517141beabe',
            userName: 'Raegan.Ritchie50@yahoo.com',
            displayName: 'Dr. Kirk Orn',
            emailValidated: false,
            affiliations: {
              totalCount: 2,
              edges: [
                {
                  node: {
                    permission: 'USER',
                    organization: {
                      id: '5585133c-1ac8-4813-81bb-448a0e093c01',
                      acronym: 'CICS',
                      name: 'Kreiger - Schamberger',
                      slug: 'Kreiger---Schamberger',
                      verified: true,
                    },
                  },
                },
                {
                  node: {
                    permission: 'ADMIN',
                    organization: {
                      id: '1c28618a-b792-4953-9f04-1522a98470ab',
                      acronym: 'FCAC',
                      name: 'Leannon, Sporer and Langworth',
                      slug: 'Leannon-Sporer-and-Langworth',
                      verified: false,
                    },
                  },
                },
              ],
            },
          },
        },
        {
          cursor: 'Hello World',
          node: {
            id: '760a4af2-0b33-4567-8b3b-57e0f84cb570',
            userName: 'Kacey.Witting43@hotmail.com',
            displayName: 'Jonathan Kassulke',
            emailValidated: false,
            affiliations: {
              totalCount: 2,
              edges: [
                {
                  node: {
                    permission: 'ADMIN',
                    organization: {
                      id: 'e5c355ae-5ec0-47a9-9156-2889ac51ca75',
                      acronym: 'CICS',
                      name: 'Funk Group',
                      slug: 'Funk-Group',
                      verified: false,
                    },
                  },
                },
                {
                  node: {
                    permission: 'ADMIN',
                    organization: {
                      id: '080fde14-f99c-4739-8058-099dfd495d0d',
                      acronym: 'CRA',
                      name: 'Cole, Lockman and Pagac',
                      slug: 'Cole-Lockman-and-Pagac',
                      verified: false,
                    },
                  },
                },
              ],
            },
          },
        },
        {
          cursor: 'Hello World',
          node: {
            id: 'hb47h74edrbh48d4658f4n9',
            userName: 'test.user@test.ca',
            displayName: 'Arny Schwartz',
            emailValidated: true,
            affiliations: {
              totalCount: 0,
              edges: [],
            },
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: 'Hello World',
        hasPreviousPage: true,
        startCursor: 'Hello World',
        __typename: 'PageInfo',
      },
    },
  },
}

const successMocks = [
  {
    request: {
      query: FIND_MY_USERS,
      variables: {
        first: 50,
        orderBy: { field: 'USER_USERNAME', direction: 'ASC' },
        search: '',
      },
    },
    result: saUserListMockData,
  },
  {
    request: {
      query: UPDATE_USER_ROLE,
      variables: {
        userName: saUserListMockData.data.findMyUsers.edges[0].node.userName,
        orgId: saUserListMockData.data.findMyUsers.edges[0].node.affiliations.edges[0].node.organization.id,
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
      query: REMOVE_USER_FROM_ORG,
      variables: {
        userId: saUserListMockData.data.findMyUsers.edges[0].node.id,
        orgId: saUserListMockData.data.findMyUsers.edges[0].node.affiliations.edges[0].node.organization.id,
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

describe('<SuperAdminUserList />', () => {
  it('successfully renders with mocked data', async () => {
    const { queryByText } = render(
      <MockedProvider mocks={successMocks} cache={createCache()}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/admin/users']}>
                <SuperAdminUserList permission={'SUPER_ADMIN'} />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    // wait for query to load
    await waitFor(() => expect(queryByText(/search/i)).toBeInTheDocument())
    // get user data
    await waitFor(() => expect(queryByText(/Jonathan Kassulke/i)).toBeInTheDocument())
  })
  describe('individual user cards', () => {
    it('are clickable', async () => {
      const { queryByText, getByRole } = render(
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
                <MemoryRouter initialEntries={['/admin/users']}>
                  <SuperAdminUserList permission={'SUPER_ADMIN'} />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      // wait for query to load
      await waitFor(() => expect(queryByText(/search/i)).toBeInTheDocument())
      // get user data
      await waitFor(() => expect(queryByText(/Raegan.Ritchie50@yahoo.com/i)).toBeInTheDocument())
      const userCard1 = getByRole('button', {
        name: /Raegan.Ritchie50@yahoo.com/i,
      })
      fireEvent.click(userCard1)
    })
    describe('when clicked', () => {
      describe('when user has affiliations', () => {
        it('lists cards for each org', async () => {
          const { queryByText, getByRole } = render(
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
                    <MemoryRouter initialEntries={['/admin/users']}>
                      <SuperAdminUserList permission={'SUPER_ADMIN'} />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )
          // wait for query to load
          await waitFor(() => expect(queryByText(/search/i)).toBeInTheDocument())
          // get user data
          await waitFor(() => expect(queryByText(/Raegan.Ritchie50@yahoo.com/i)).toBeInTheDocument())
          const userCard1 = getByRole('button', {
            name: /Raegan.Ritchie50@yahoo.com/i,
          })
          fireEvent.click(userCard1)

          await waitFor(() => expect(queryByText(/Kreiger - Schamberger/i)).toBeInTheDocument())
        })

        describe('admin abilities', () => {
          it("edit user's role in org", async () => {
            const { queryByText, getByRole, queryAllByText } = render(
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
                      <MemoryRouter initialEntries={['/admin/users']}>
                        <SuperAdminUserList permission={'SUPER_ADMIN'} />
                      </MemoryRouter>
                    </I18nProvider>
                  </ChakraProvider>
                </UserVarProvider>
              </MockedProvider>,
            )
            // wait for query to load
            await waitFor(() => expect(queryByText(/search/i)).toBeInTheDocument())
            // get user data
            await waitFor(() => expect(queryByText(/Raegan.Ritchie50@yahoo.com/i)).toBeInTheDocument())
            const userCard1 = getByRole('button', {
              name: /Raegan.Ritchie50@yahoo.com/i,
            })
            fireEvent.click(userCard1)
            await waitFor(() => expect(queryByText(/Kreiger - Schamberger/i)).toBeInTheDocument())
            const editBtn = getByRole('button', {
              name: 'Edit Raegan.Ritchie50@yahoo.com in Kreiger - Schamberger',
            })
            fireEvent.click(editBtn)
            await waitFor(() => expect(queryAllByText(/Edit User/i)[0]).toBeInTheDocument())
          })
          it('remove user from org', async () => {
            const { queryByText, getByRole, queryAllByText } = render(
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
                      <MemoryRouter initialEntries={['/admin/users']}>
                        <SuperAdminUserList permission={'SUPER_ADMIN'} />
                      </MemoryRouter>
                    </I18nProvider>
                  </ChakraProvider>
                </UserVarProvider>
              </MockedProvider>,
            )
            // wait for query to load
            await waitFor(() => expect(queryByText(/search/i)).toBeInTheDocument())
            // get user data
            await waitFor(() => expect(queryByText(/Raegan.Ritchie50@yahoo.com/i)).toBeInTheDocument())
            const userCard1 = getByRole('button', {
              name: /Raegan.Ritchie50@yahoo.com/i,
            })
            fireEvent.click(userCard1)
            await waitFor(() => expect(queryByText(/Kreiger - Schamberger/i)).toBeInTheDocument())
            const removeBtn = getByRole('button', {
              name: 'Remove Raegan.Ritchie50@yahoo.com from Kreiger - Schamberger',
            })
            fireEvent.click(removeBtn)
            await waitFor(() => expect(queryAllByText(/Remove User/i)))
          })
        })
      })
      describe('when user has no affilitions', () => {
        it('displays appropriate message', async () => {
          const { queryByText, getByRole } = render(
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
                    <MemoryRouter initialEntries={['/admin/users']}>
                      <SuperAdminUserList permission={'SUPER_ADMIN'} />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )
          // wait for query to load
          await waitFor(() => expect(queryByText(/search/i)).toBeInTheDocument())
          // get user data
          await waitFor(() => expect(queryByText(/Raegan.Ritchie50@yahoo.com/i)).toBeInTheDocument())
          const userCard1 = getByRole('button', {
            name: /Raegan.Ritchie50@yahoo.com/i,
          })
          fireEvent.click(userCard1)

          await waitFor(() =>
            expect(queryByText(/This user is not affiliated with any organizations/i)).toBeInTheDocument(),
          )
        })
      })
    })
  })
})
