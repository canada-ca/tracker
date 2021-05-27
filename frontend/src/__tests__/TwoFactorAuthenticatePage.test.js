import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { MemoryRouter, Route, Router } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import TwoFactorAuthenticatePage from '../TwoFactorAuthenticatePage'
import { AUTHENTICATE } from '../graphql/mutations'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { createMemoryHistory } from 'history'
import { ApolloProvider } from '@apollo/client'
import { client } from '../client'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<TwoFactorAuthenticatePage />', () => {
  it('renders correctly', async () => {
    const { getByText } = render(
      <ApolloProvider client={client}>
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={['/authenticate/phone/authenticate-token-test']}
                initialIndex={0}
              >
                <Route path="/authenticate/:sendMethod/:authenticateToken">
                  <MockedProvider>
                    <TwoFactorAuthenticatePage />
                  </MockedProvider>
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>
      </ApolloProvider>,
    )

    await waitFor(() =>
      expect(getByText(/Two Factor Authentication/)).toBeInTheDocument(),
    )
  })

  describe('given no input', () => {
    describe('when the form is submitted', () => {
      describe('two factor code input', () => {
        it('displays an error message', async () => {
          const { getByText } = render(
            <ApolloProvider client={client}>
              <UserStateProvider
                initialState={{
                  userName: null,
                  jwt: null,
                  tfaSendMethod: null,
                }}
              >
                <ThemeProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter
                      initialEntries={[
                        '/authenticate/phone/authenticate-token-test',
                      ]}
                      initialIndex={0}
                    >
                      <MockedProvider>
                        <Route path="/authenticate/:sendMethod/:authenticateToken">
                          <TwoFactorAuthenticatePage />
                        </Route>
                      </MockedProvider>
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </ApolloProvider>,
          )
          const submitButton = getByText('Submit')
          fireEvent.click(submitButton)

          await waitFor(() => {
            expect(
              getByText(/Code field must not be empty/i),
            ).toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('when authentication succeeds', () => {
    it('redirects to home page', async () => {
      const values = {
        authenticateToken: 'authenticate-token-test',
        authenticationCode: 123456,
      }

      const mocks = [
        {
          request: {
            query: AUTHENTICATE,
            variables: {
              authenticateToken: values.authenticateToken,
              authenticationCode: values.authenticationCode,
            },
          },
          result: {
            data: {
              authenticate: {
                result: {
                  user: {
                    userName: 'Thalia.Rosenbaum@gmail.com',
                    tfaSendMethod: 'PHONE',
                  },
                  authToken: 'test123stringJWT',
                  __typename: 'AuthResult',
                },
              },
            },
          },
        },
      ]

      // create a history object and inject it so we can inspect it afterwards
      // for the side effects of our form submission (a redirect to /!).
      const history = createMemoryHistory({
        initialEntries: ['/authenticate/phone/authenticate-token-test'],
        initialIndex: 0,
      })

      const { container, getByRole } = render(
        <ApolloProvider client={client}>
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <Router history={history}>
                  <Route path="/authenticate/:sendMethod/:authenticateToken">
                    <MockedProvider mocks={mocks} addTypename={false}>
                      <TwoFactorAuthenticatePage />
                    </MockedProvider>
                  </Route>
                </Router>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>
        </ApolloProvider>,
      )

      const twoFactorCode = container.querySelector('#twoFactorCode')
      const form = getByRole('form')

      fireEvent.change(twoFactorCode, {
        target: {
          value: values.authenticationCode,
        },
      })

      fireEvent.submit(form)

      await waitFor(() => {
        expect(history.location.pathname).toEqual('/')
      })
    })
  })
})
