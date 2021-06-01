import React from 'react'
import { UserStateProvider } from '../UserState'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { USER_AFFILIATIONS } from '../graphql/queries'
import AdminPage from '../AdminPage'
import { waitFor, render, fireEvent } from '@testing-library/react'

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
        query: USER_AFFILIATIONS,
        variables: {
          first: 100,
          orderBy: {
            field: 'ORG_ACRONYM',
            direction: 'ASC',
          },
        },
      },
      result: {
        data: {
          findMe: {
            id: 'a769ac44-eeef-4fe8-af9b-16b6b458e981',
            affiliations: {
              edges: [
                {
                  node: {
                    organization: {
                      id: '13fc644f-ffbf-4ee3-af9d-84b11550fba8',
                      acronym: 'INFC',
                      slug: 'Corkery---Gottlieb',
                    },
                    permission: 'SUPER_ADMIN',
                  },
                },
                {
                  node: {
                    organization: {
                      id: 'e421102f-eab4-4b94-951b-37f7f5a1bde3',
                      acronym: 'DND',
                      slug: 'Cruickshank---Smitham',
                    },
                    permission: 'USER',
                  },
                },
                {
                  node: {
                    organization: {
                      id: 'd2533a97-dbfb-44e2-9f1c-577d6e80ef50',
                      acronym: 'CSIS',
                      slug: 'Heller-Dickens-and-Mitchell',
                    },
                    permission: 'SUPER_ADMIN',
                  },
                },
              ],
            },
          },
        },
      },
    },
  ]

  const empty = [
    {
      request: {
        query: USER_AFFILIATIONS,
        variables: {
          first: 100,
          orderBy: {
            field: 'ORG_ACRONYM',
            direction: 'ASC',
          },
        },
      },
      result: {
        data: {
          findMe: {
            id: 'a769ac44-eeef-4fe8-af9b-16b6b458e981',
            affiliations: {
              edges: [],
            },
          },
        },
      },
    },
  ]

  it('renders if user not an admin', async () => {
    const { getByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'me',
          jwt: 'longstring',
          tfaSendMethod: null,
        }}
      >
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <MockedProvider mocks={empty} addTypename={false}>
              <AdminPage />
            </MockedProvider>
          </ThemeProvider>
        </I18nProvider>
      </UserStateProvider>,
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
      <UserStateProvider
        initialState={{
          userName: 'me',
          jwt: 'longstring',
          tfaSendMethod: null,
        }}
      >
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <AdminPage />
            </MockedProvider>
          </ThemeProvider>
        </I18nProvider>
      </UserStateProvider>,
    )

    await waitFor(() => {
      const welcome = getByText(/Welcome, Admin/i)
      expect(welcome).toBeInTheDocument()
    })
  })

  describe('Organization select', () => {
    it('displays info for admin', async () => {
      const { getByText, getByLabelText } = render(
        <UserStateProvider
          initialState={{
            userName: 'me',
            jwt: 'longstring',
            tfaSendMethod: null,
          }}
        >
          <I18nProvider i18n={i18n}>
            <ThemeProvider theme={theme}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <AdminPage />
              </MockedProvider>
            </ThemeProvider>
          </I18nProvider>
        </UserStateProvider>,
      )

      await waitFor(() => {
        const selectMessage = getByText(
          /Select an organization to view admin options/i,
        )
        expect(selectMessage).toBeInTheDocument()
      })

      await waitFor(() => {
        const orgSelect = getByLabelText('select-an-organization')
        fireEvent.change(orgSelect, { target: { value: 'INFC' } })
      })
    })
  })
})
