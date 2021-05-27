import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter, Route } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import CreateUserPage from '../CreateUserPage'
import { SIGN_UP } from '../graphql/mutations'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
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
      query: SIGN_UP,
    },
    result: {
      data: {
        user: {
          userName: 'foo@example.com',
        },
      },
    },
  },
]

describe('<CreateUserPage />', () => {
  describe('given optional invited token', () => {
    it('displays a notification', async () => {
      const { queryByText } = render(
        <ApolloProvider client={client}>
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter
                  initialEntries={['/create-user/invited-token-test']}
                  initialIndex={0}
                >
                  <Route path="/create-user/:userOrgToken?">
                    <MockedProvider mocks={mocks}>
                      <CreateUserPage />
                    </MockedProvider>
                  </Route>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>
        </ApolloProvider>,
      )

      await waitFor(() =>
        expect(
          queryByText(
            /Your account will automatically be linked to the organization that invited you./,
          ),
        ).toBeInTheDocument(),
      )
    })
  })

  describe('given no input', () => {
    describe('when onBlur fires', () => {
      describe('email field', () => {
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
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <MockedProvider mocks={mocks}>
                        <CreateUserPage />
                      </MockedProvider>
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </ApolloProvider>,
          )

          const email = container.querySelector('#email')

          await waitFor(() => {
            fireEvent.blur(email)
          })

          await waitFor(() =>
            expect(queryByText(/Email cannot be empty/i)).toBeInTheDocument(),
          )
        })
      })

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
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <MockedProvider mocks={mocks}>
                        <CreateUserPage />
                      </MockedProvider>
                    </MemoryRouter>
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
            // This should work exactly like the email field above, but it
            // doesn't! The message is displayed but we can only get partial
            // match for some reason.
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
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <MockedProvider mocks={mocks}>
                        <CreateUserPage />
                      </MockedProvider>
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </ApolloProvider>,
          )

          const confirmPassword = container.querySelector('#confirmPassword')

          await waitFor(() => fireEvent.blur(confirmPassword))

          await waitFor(() =>
            // This should work exactly like the email field above, but it
            // doesn't! The message is displayed but we can only get partial
            // match for some reason.
            expect(queryByText(/Password confirmation/)).toBeInTheDocument(),
          )
        })
      })

      describe('language selection', () => {
        it('displays required message', async () => {
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
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <MockedProvider mocks={mocks}>
                        <CreateUserPage />
                      </MockedProvider>
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </ApolloProvider>,
          )

          const languageSelect = container.querySelector('#lang')

          await waitFor(() => fireEvent.blur(languageSelect))

          await waitFor(() =>
            // This should work exactly like the email field above, but it
            // doesn't! The message is displayed but we can only get partial
            // match for some reason.
            expect(
              queryByText(/Select Preferred Language/),
            ).toBeInTheDocument(),
          )
        })
      })

      describe('language selection', () => {
        it('displays required message', async () => {
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
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <MockedProvider mocks={mocks}>
                        <CreateUserPage />
                      </MockedProvider>
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </ApolloProvider>,
          )

          const languageSelect = container.querySelector('#lang')

          await waitFor(() => fireEvent.blur(languageSelect))

          await waitFor(() =>
            // This should work exactly like the email field above, but it
            // doesn't! The message is displayed but we can only get partial
            // match for some reason.
            expect(
              queryByText(/Select Preferred Language/),
            ).toBeInTheDocument(),
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
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <MockedProvider mocks={mocks}>
                        <CreateUserPage />
                      </MockedProvider>
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </ApolloProvider>,
          )

          const confirmPassword = container.querySelector('#confirmPassword')

          await waitFor(() => fireEvent.blur(confirmPassword))

          await waitFor(() =>
            // This should work exactly like the email field above, but it
            // doesn't! The message is displayed but we can only get partial
            // match for some reason.
            expect(queryByText(/Password confirmation/)).toBeInTheDocument(),
          )
        })
      })
    })
  })
})
