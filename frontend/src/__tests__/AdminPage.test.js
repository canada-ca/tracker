import React from 'react'
import { UserVarProvider } from '../UserState'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { ADMIN_AFFILIATIONS, IS_USER_SUPER_ADMIN } from '../graphql/queries'
import AdminPage from '../AdminPage'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { makeVar } from '@apollo/client'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
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
            field: 'ACRONYM',
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
                  id: '45b90ed6-1a51-40bf-af14-8e0729d32ecd',
                  acronym: 'DND',
                  slug: 'Wilkinson-Zboncak-and-Kautzer',
                },
              },
              {
                node: {
                  id: '4fe79da5-5c1b-43f5-9fc9-19b193753198',
                  acronym: 'GAC',
                  slug: 'Parker-Marquardt-and-Rempel',
                },
              },
              {
                node: {
                  id: '65c691b9-748b-4d31-96a9-ec6e01be0c19',
                  acronym: 'FCAC',
                  slug: 'Homenick-LLC',
                },
              },
              {
                node: {
                  id: '7751c715-eb3c-4aa3-83db-e8247d186acf',
                  acronym: 'CSE',
                  slug: 'Kiehn-Schroeder-and-Orn',
                },
              },
              {
                node: {
                  id: '551b4c52-2c6a-4361-955f-de349edbd798',
                  acronym: 'DND',
                  slug: 'Hartmann---Bartoletti',
                },
              },
              {
                node: {
                  id: 'd433cda9-e79d-41af-b0c1-62c97ebd9812',
                  acronym: 'GAC',
                  slug: 'Skiles-Nicolas-and-McKenzie',
                },
              },
              {
                node: {
                  id: '139d6125-dbbf-477b-907c-0f6de31dd50b',
                  acronym: 'OIC',
                  slug: 'Denesik-Inc',
                },
              },
              {
                node: {
                  id: '060fe25a-5679-40dc-892a-caf6d5d66c8b',
                  acronym: 'INFC',
                  slug: 'Kub-Johns-and-Zieme',
                },
              },
              {
                node: {
                  id: 'aa8f12ac-5f74-489e-b64d-67e8eccfded2',
                  acronym: 'OIC',
                  slug: 'Gorczany-White-and-Harvey',
                },
              },
              {
                node: {
                  id: '68b6f7f7-8c50-4003-914d-287729934cd2',
                  acronym: 'RCMP',
                  slug: 'Walsh-Streich-and-Moen',
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
            field: 'ACRONYM',
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
            <ThemeProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin']} initialIndex={0}>
                <AdminPage />
              </MemoryRouter>
            </ThemeProvider>
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
            <ThemeProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin']} initialIndex={0}>
                <AdminPage />
              </MemoryRouter>
            </ThemeProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      const welcome = getByText(/Welcome, Admin/i)
      expect(welcome).toBeInTheDocument()
    })
  })

  describe('Organization select', () => {
    it('displays info for admin', async () => {
      const { getByText } = render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <I18nProvider i18n={i18n}>
              <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={['/admin']} initialIndex={0}>
                  <AdminPage />
                </MemoryRouter>
              </ThemeProvider>
            </I18nProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        const selectMessage = getByText(
          /Select an organization to view admin options/i,
        )
        expect(selectMessage).toBeInTheDocument()
      })

      await waitFor(() => {
        const orgSelect = getByText('Select an organization')
        fireEvent.change(orgSelect, { value: 'INFC' })
      })
    })
  })
})
