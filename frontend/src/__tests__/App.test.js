import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { waitFor, render, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { UserStateProvider } from '../UserState'
import { IS_USER_ADMIN } from '../graphql/queries'
import App from '../App'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<App/>', () => {
  afterEach(cleanup)

  const isAdmin = [
    {
      request: {
        query: IS_USER_ADMIN,
      },
      result: {
        data: {
          user: [
            {
              affiliations: {
                edges: [
                  {
                    node: {
                      organization: {
                        id: 'YXBwIGFkbWluIHRlc3Q=',
                        acronym: 'ABC',
                      },
                      permission: 'ADMIN',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
  ]

  describe('routes', () => {
    describe('/', () => {
      it('renders the main page', async () => {
        const { getByRole } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfa: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={setupI18n()}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <MockedProvider mocks={isAdmin} addTypename={false}>
                    <App />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )
        await waitFor(() =>
          expect(getByRole('heading')).toHaveTextContent(/track web/i),
        )
      })
    })

    describe('/sign-in', () => {
      it('renders the sign-in page', async () => {
        const { getByText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfa: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={setupI18n()}>
                <MemoryRouter initialEntries={['/sign-in']} initialIndex={0}>
                  <MockedProvider mocks={isAdmin} addTypename={false}>
                    <App />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )
        const domains = await waitFor(() => getByText(/Sign in/i))
        await waitFor(() => {
          expect(domains).toBeInTheDocument()
        })
      })
    })
  })
})
