import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { waitFor, render, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { UserStateProvider } from '../UserState'
import { DOMAINS } from '../graphql/queries'
import App from '../App'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<App/>', () => {
  afterEach(cleanup)

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
                  <MockedProvider>
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

    describe('/domains', () => {
      const mocks = [
        {
          request: {
            query: DOMAINS,
          },
          result: {
            data: {
              domains: {
                edges: [
                  {
                    node: {
                      organization: {
                        acronym: 'BC',
                      },
                      url: 'bonita.com',
                    },
                  },
                  {
                    node: {
                      organization: {
                        acronym: 'BC',
                      },
                      url: 'elenora.com',
                    },
                  },
                ],
              },
            },
          },
        },
      ]
      it('renders the domains page', async () => {
        const { queryByText } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfa: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={setupI18n()}>
                <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                  <MockedProvider mocks={mocks} addTypename={false}>
                    <App />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )
        await waitFor(() => {
          expect(queryByText(/Domains/i)).toBeInTheDocument()
        })
      })
    })
  })
})
