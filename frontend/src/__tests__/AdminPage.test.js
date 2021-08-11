import React from 'react'
import { UserVarProvider } from '../UserState'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { ADMIN_AFFILIATIONS, IS_USER_SUPER_ADMIN } from '../graphql/queries'
import AdminPage from '../AdminPage'
import { waitFor, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import userEvent from '@testing-library/user-event'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('<AdminPage />', () => {
  const mocks = [
    {
      request: {
        query: ADMIN_AFFILIATIONS,
        variables: {
          first: 100,
          orderBy: {
            field: 'NAME',
            direction: 'ASC',
          },
          isAdmin: true,
          includeSuperAdminOrg: true,
        },
      },
      result: {
        data: {
          findMyOrganizations: {
            edges: [
              {
                node: {
                  id: '39ac4aac-e559-4f9f-8c83-a3d38976fe48',
                  acronym: 'CSIS',
                  slug: 'Hane---Pollich',
                  name: 'Hane - Pollich',
                },
              },
              {
                node: {
                  id: '9ceb4c07-8034-4588-824c-f71313cd9e08',
                  acronym: 'HC',
                  slug: 'Wolf-Group',
                  name: 'Wolf Group',
                },
              },
              {
                node: {
                  id: 'a1d935e3-02fe-4001-9161-5d3c68b62b8e',
                  acronym: 'TBS',
                  slug: 'Goodwin---OConnell',
                  name: "Goodwin - O'Connell",
                },
              },
            ],
          },
        },
      },
    },
    {
      request: {
        query: IS_USER_SUPER_ADMIN,
        variables: {},
      },
      result: {
        data: {
          isUserSuperAdmin: false,
        },
      },
    },
  ]

  const empty = [
    {
      request: {
        query: ADMIN_AFFILIATIONS,
        variables: {
          first: 100,
          orderBy: {
            field: 'NAME',
            direction: 'ASC',
          },
          isAdmin: true,
          includeSuperAdminOrg: true,
        },
      },
      result: {
        data: {
          findMyOrganizations: {
            edges: [],
          },
        },
      },
    },
    {
      request: {
        query: IS_USER_SUPER_ADMIN,
        variables: {},
      },
      result: {
        data: {
          isUserSuperAdmin: false,
        },
      },
    },
  ]

  it('renders if user not an admin', async () => {
    const { getByText } = render(
      <MockedProvider mocks={empty} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <I18nProvider i18n={i18n}>
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin']} initialIndex={0}>
                <AdminPage />
              </MemoryRouter>
            </ChakraProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      const welcome = getByText(
        /You do not have admin permissions in any organization/i,
      )
      expect(welcome).toBeInTheDocument()
    })
  })

  it('renders correctly', async () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <I18nProvider i18n={i18n}>
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin']} initialIndex={0}>
                <AdminPage />
              </MemoryRouter>
            </ChakraProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      const welcome = getByText(/Select an organization to view admin options/i)
      expect(welcome).toBeInTheDocument()
    })
  })

  describe('Organization select', () => {
    it('displays info for admin', async () => {
      const {
        getByText,
        getByPlaceholderText,
        findByRole,
        findByText,
      } = render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <MemoryRouter initialEntries={['/admin']} initialIndex={0}>
                  <AdminPage />
                </MemoryRouter>
              </ChakraProvider>
            </I18nProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const organizationInput = await findByRole('textbox', {
        name: /Organization/,
      })
      userEvent.click(organizationInput)

      const orgEntry = getByText(/Wolf Group/)
      userEvent.click(orgEntry)

      await findByText(/Slug: Wolf-Group/)
    })
  })
})
