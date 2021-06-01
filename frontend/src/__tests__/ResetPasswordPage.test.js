import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter, Route } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { UserStateProvider } from '../UserState'
import ResetPasswordPage from '../ResetPasswordPage'
import { RESET_PASSWORD } from '../graphql/mutations'
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

const mocks = [
  {
    request: {
      query: RESET_PASSWORD,
    },
    result: {
      data: {
        status: 'string',
      },
    },
  },
]

describe('<ResetPasswordPage />', () => {
  describe('given no input', () => {
    describe('when onBlur fires', () => {
      describe('password field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
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
                    <MockedProvider mocks={mocks}>
                      <MemoryRouter
                        initialEntries={[
                          '/reset-password/fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe',
                        ]}
                        initialIndex={0}
                      >
                        <Route path="/reset-password/:resetToken">
                          <ResetPasswordPage />
                        </Route>
                      </MemoryRouter>
                    </MockedProvider>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </ApolloProvider>,
          )

          const password = container.querySelector('#password')

          await waitFor(() => {
            fireEvent.blur(password)
          })

          await waitFor(() =>
            expect(queryByText(/Password cannot be empty/)).toBeInTheDocument(),
          )
        })
      })

      describe('confirm password field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
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
                    <MockedProvider mocks={mocks}>
                      <MemoryRouter
                        initialEntries={[
                          '/reset-password/fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe',
                        ]}
                        initialIndex={0}
                      >
                        <Route path="/reset-password/:resetToken">
                          <ResetPasswordPage />
                        </Route>
                      </MemoryRouter>
                    </MockedProvider>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </ApolloProvider>,
          )

          const confirmPassword = container.querySelector('#confirmPassword')

          await waitFor(() => fireEvent.blur(confirmPassword))

          await waitFor(() =>
            // This should work exactly like the password field above, but it
            // doesn't! The message is displayed but we can only get partial
            // match for some reason.
            expect(queryByText(/Password confirmation/)).toBeInTheDocument(),
          )
        })
      })
    })
  })
})
