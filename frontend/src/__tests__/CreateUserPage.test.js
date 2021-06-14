import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { MemoryRouter, Route } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import CreateUserPage from '../CreateUserPage'
import { SIGN_UP } from '../graphql/mutations'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'

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
        signUp: {
          result: {
            __typename: 'SignUpError',
            code: 98,
            description: 'Hello World',
          },
          __typename: 'SignUpPayload',
        },
      },
    },
  },
]

describe('<CreateUserPage />', () => {
  it('renders', async () => {
    const { queryByText } = render(
      <MockedProvider mocks={mocks}>
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
                  <CreateUserPage />
                </Route>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>
      </MockedProvider>,
    )

    await waitFor(() =>
      expect(
        queryByText(/Create an account by entering an email and password./),
      ).toBeInTheDocument(),
    )
  })

  describe('given optional invited token', () => {
    it('displays a notification', async () => {
      const { queryByText } = render(
        <MockedProvider mocks={mocks}>
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
                    <CreateUserPage />
                  </Route>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>
        </MockedProvider>,
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
            <MockedProvider mocks={mocks}>
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
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </MockedProvider>,
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

      describe('display name field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
            <MockedProvider mocks={mocks}>
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
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </MockedProvider>,
          )

          const name = container.querySelector('#displayName')

          await waitFor(() => {
            fireEvent.blur(name)
          })

          await waitFor(() =>
            expect(
              queryByText(/Display name cannot be empty/i),
            ).toBeInTheDocument(),
          )
        })
      })

      describe('password field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
            <MockedProvider mocks={mocks}>
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
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </MockedProvider>,
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
            <MockedProvider mocks={mocks}>
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
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </MockedProvider>,
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
            <MockedProvider mocks={mocks}>
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
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </MockedProvider>,
          )

          const languageSelect = container.querySelector('#lang')

          await waitFor(() => fireEvent.blur(languageSelect))

          await waitFor(() =>
            expect(
              queryByText(/Select Preferred Language/),
            ).toBeInTheDocument(),
          )
        })

        it('displays error message', async () => {
          const { container, queryByText } = render(
            <MockedProvider mocks={mocks}>
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
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </MockedProvider>,
          )

          const languageSelect = container.querySelector('#lang')

          await waitFor(() => {
            fireEvent.blur(languageSelect)
          })

          await waitFor(() =>
            expect(
              queryByText(/Please choose your preferred language/i),
            ).toBeInTheDocument(),
          )
        })
      })
    })
  })
  describe('given incorrect input', () => {
    describe('when onBlur fires', () => {
      describe('password field', () => {
        it('displays password length message', async () => {
          const { container, queryByText } = render(
            <MockedProvider mocks={mocks}>
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
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </MockedProvider>,
          )

          const password = container.querySelector('#password')

          await waitFor(() => {
            fireEvent.change(password, {
              target: {
                value: 'short',
              },
            })
          })

          await waitFor(() => {
            fireEvent.blur(password)
            expect(
              queryByText(/Password must be at least 12 characters long/i),
            ).toBeInTheDocument()
          })
        })
      })

      describe('password confirm field', () => {
        it('displays matching error message', async () => {
          const { container, queryByText } = render(
            <MockedProvider mocks={mocks}>
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
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ThemeProvider>
              </UserStateProvider>
            </MockedProvider>,
          )

          const confirmPassword = container.querySelector('#confirmPassword')

          await waitFor(() => {
            fireEvent.change(confirmPassword, {
              target: {
                value: 'shorter',
              },
            })
          })

          await waitFor(() => {
            fireEvent.blur(confirmPassword)
            expect(queryByText(/Passwords must match/i)).toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('given correct input in all fields', () => {
    it('fails to create account', async () => {
      const { container, getByText } = render(
        <MockedProvider mocks={mocks}>
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <CreateUserPage />
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>
        </MockedProvider>,
      )

      // fill in each field
      const email = container.querySelector('#email')
      const displayName = container.querySelector('#displayName')
      const password = container.querySelector('#password')
      const confirmPassword = container.querySelector('#confirmPassword')
      const lang = container.querySelector('#lang')

      await waitFor(() => {
        fireEvent.change(email, { target: { value: 'user@test.email.ca' } })
        fireEvent.change(displayName, { target: { value: 'Test User' } })
        fireEvent.change(password, { target: { value: 'SuperSecretPassword' } })
        fireEvent.change(confirmPassword, {
          target: { value: 'SuperSecretPassword' },
        })
        fireEvent.change(lang, { target: { value: 'ENGLISH' } })
      })

      // fire mutation
      const createAccount = getByText(/Create Account/i)
      await waitFor(() => {
        fireEvent.click(createAccount)
      })

      // expect success
      await waitFor(() => {
        expect(
          getByText(/Unable to create your account, please try again./i),
        ).toBeInTheDocument()
      })
    })
  })
})
