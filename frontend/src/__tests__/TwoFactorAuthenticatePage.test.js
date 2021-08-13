import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Router } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { createMemoryHistory } from 'history'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import TwoFactorAuthenticatePage from '../auth/TwoFactorAuthenticatePage'
import { UserVarProvider } from '../utilities/userState'
import { AUTHENTICATE } from '../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('<TwoFactorAuthenticatePage />', () => {
  it('renders correctly', async () => {
    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={['/authenticate/phone/authenticate-token-test']}
                initialIndex={0}
              >
                <Route path="/authenticate/:sendMethod/:authenticateToken">
                  <TwoFactorAuthenticatePage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
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
            <MockedProvider>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter
                      initialEntries={[
                        '/authenticate/phone/authenticate-token-test',
                      ]}
                      initialIndex={0}
                    >
                      <Route path="/authenticate/:sendMethod/:authenticateToken">
                        <TwoFactorAuthenticatePage />
                      </Route>
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
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
        <MockedProvider mocks={mocks} addTypename={false}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <Router history={history}>
                  <Route path="/authenticate/:sendMethod/:authenticateToken">
                    <TwoFactorAuthenticatePage />
                  </Route>
                </Router>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
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
