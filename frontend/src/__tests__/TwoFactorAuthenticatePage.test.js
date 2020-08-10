import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter, Route, Router } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import TwoFactorAuthenticatePage from '../TwoFactorAuthenticatePage'
import { AUTHENTICATE } from '../graphql/mutations'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { createMemoryHistory } from 'history'

describe('<TwoFactorAuthenticatePage />', () => {
  it('renders correctly', async () => {
    const { queryByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter
              initialEntries={['/authenticate/authenticate-token-test']}
              initialIndex={0}
            >
              <MockedProvider>
                <TwoFactorAuthenticatePage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() =>
      expect(queryByText(/Two Factor Authentication/)).toBeInTheDocument(),
    )
  })

  describe('given no input', () => {
    describe('when the form is submitted', () => {
      describe('two factor code input', () => {
        it('displays an error message', async () => {
          const { getByText } = render(
            <UserStateProvider
              initialState={{ userName: null, jwt: null, tfa: null }}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={setupI18n()}>
                  <MemoryRouter
                    initialEntries={['/authenticate/authenticate-token-test']}
                    initialIndex={0}
                  >
                    <MockedProvider>
                      <TwoFactorAuthenticatePage />
                    </MockedProvider>
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserStateProvider>,
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
                authResult: {
                  user: {
                    userName: 'Thalia.Rosenbaum@gmail.com',
                    tfa: false,
                  },
                  authToken: 'test123stringJWT',
                },
              },
            },
          },
        },
      ]

      // create a history object and inject it so we can inspect it afterwards
      // for the side effects of our form submission (a redirect to /!).
      const history = createMemoryHistory({
        initialEntries: ['/authenticate/authenticate-token-test'],
        initialIndex: 0,
      })

      const { container, getByRole } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfa: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
              <Router history={history}>
                <Route path="/authenticate/:authenticateToken">
                  <MockedProvider mocks={mocks} addTypename={false}>
                    <TwoFactorAuthenticatePage />
                  </MockedProvider>
                </Route>
              </Router>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
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
