import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import userEvent from '@testing-library/user-event'

import CreateUserPage from '../CreateUserPage'

import { UserVarProvider } from '../../utilities/userState'
import { SIGN_UP } from '../../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
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
            description: 'Your account could not be created',
          },
          __typename: 'SignUpPayload',
        },
      },
    },
  },
]

describe('<CreateUserPage />', () => {
  it('renders', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <div>Landing Page</div>,
        },
        {
          path: '/create-user/:userOrgToken?',
          element: <CreateUserPage />,
        },
      ],
      {
        // Set for where you want to start in the routes. Remember, KISS (Keep it simple, stupid) the routes.
        initialEntries: ['/create-user/invited-token-test'],
        // We don't need to explicitly set this, but it's nice to have.
        initialIndex: 0,
      },
    )

    const { queryByText } = render(
      <MockedProvider mocks={mocks}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <RouterProvider router={router}>
                <CreateUserPage />
              </RouterProvider>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => expect(queryByText(/Welcome to Tracker, please enter your details./)).toBeInTheDocument())
  })

  describe('given optional invited token', () => {
    it('displays a notification', async () => {
      const router = createMemoryRouter(
        [
          {
            path: '/',
            element: <div>Landing Page</div>,
          },
          {
            path: '/create-user/:userOrgToken?',
            element: <CreateUserPage />,
          },
        ],
        {
          // Set for where you want to start in the routes. Remember, KISS (Keep it simple, stupid) the routes.
          initialEntries: ['/create-user/invited-token-test'],
          // We don't need to explicitly set this, but it's nice to have.
          initialIndex: 0,
        },
      )

      const { queryByText } = render(
        <MockedProvider mocks={mocks}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <RouterProvider router={router}>
                  <CreateUserPage />
                </RouterProvider>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() =>
        expect(
          queryByText(/Your account will automatically be linked to the organization that invited you./),
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
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )

          const email = container.querySelector('#email')

          await waitFor(() => {
            fireEvent.blur(email)
          })

          await waitFor(() => expect(queryByText(/Email cannot be empty/i)).toBeInTheDocument())
        })
      })

      describe('display name field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
            <MockedProvider mocks={mocks}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )

          const name = container.querySelector('#displayName')

          await waitFor(() => {
            fireEvent.blur(name)
          })

          await waitFor(() => expect(queryByText(/Display name cannot be empty/i)).toBeInTheDocument())
        })
      })

      describe('password field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
            <MockedProvider mocks={mocks}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
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
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
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
    })
  })
  describe('given incorrect input', () => {
    describe('when onBlur fires', () => {
      describe('password field', () => {
        it('displays password length message', async () => {
          const { container, queryByText } = render(
            <MockedProvider mocks={mocks}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
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
            expect(queryByText(/Password must be at least 12 characters long/i)).toBeInTheDocument()
          })
        })
      })

      describe('password confirm field', () => {
        it('displays matching error message', async () => {
          const { container, queryByText } = render(
            <MockedProvider mocks={mocks}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <ChakraProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <MemoryRouter initialEntries={['/']} initialIndex={0}>
                      <CreateUserPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
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
    it('successfully creates the user account', async () => {
      const successfulMocks = [
        {
          request: {
            query: SIGN_UP,
            variables: {
              userName: 'user@test.email.ca',
              displayName: 'Test User',
              password: 'SuperSecretPassword',
              confirmPassword: 'SuperSecretPassword',
              signUpToken: '',
            },
          },
          result: {
            data: {
              signUp: {
                result: {
                  authenticateToken: '81560640-8d0d-4c20-bd10-ae589c66f137',
                  sendMethod: 'email',
                  __typename: 'TFASignInResult',
                },
                __typename: 'SignUpPayload',
              },
            },
          },
        },
      ]
      const { getByRole, findByText, getByLabelText } = render(
        <MockedProvider mocks={successfulMocks}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <CreateUserPage />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      // fill in each field
      const emailInput = getByRole('textbox', { name: /Email:/ })
      const displayNameInput = getByRole('textbox', { name: /Display Name:/ })
      // password fields don't have an aria role, so we can just get by label instead
      const passwordInput = getByLabelText('Password:')
      const confirmPasswordInput = getByLabelText('Confirm Password:')

      userEvent.type(emailInput, 'user@test.email.ca')
      userEvent.type(displayNameInput, 'Test User')
      userEvent.type(passwordInput, 'SuperSecretPassword')
      userEvent.type(confirmPasswordInput, 'SuperSecretPassword')

      // fire mutation
      const createAccountButton = getByRole('button', {
        name: /Create Account/,
      })
      userEvent.click(createAccountButton)

      // expect successful message
      const orgCreationToast = await findByText(/Account Created/i)
      await waitFor(() => expect(orgCreationToast).toBeVisible())
    })

    it('fails to create account', async () => {
      const unsuccessfulMocks = [
        {
          request: {
            query: SIGN_UP,
            variables: {
              userName: 'user@test.email.ca',
              displayName: 'Test User',
              password: 'SuperSecretPassword',
              confirmPassword: 'SuperSecretPassword',
              signUpToken: '',
            },
          },
          result: {
            data: {
              signUp: {
                result: {
                  __typename: 'SignUpError',
                  code: 98,
                  description: 'Your account could not be created',
                },
                __typename: 'SignUpPayload',
              },
            },
          },
        },
      ]

      const { getByRole, findByText, getByLabelText } = render(
        <MockedProvider mocks={unsuccessfulMocks}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <CreateUserPage />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      // fill in each field
      const emailInput = getByRole('textbox', { name: /Email:/ })
      const displayNameInput = getByRole('textbox', { name: /Display Name:/ })
      // password fields don't have an aria role, so we can just get by label instead
      const passwordInput = getByLabelText('Password:')
      const confirmPasswordInput = getByLabelText('Confirm Password:')

      userEvent.type(emailInput, 'user@test.email.ca')
      userEvent.type(displayNameInput, 'Test User')
      userEvent.type(passwordInput, 'SuperSecretPassword')
      userEvent.type(confirmPasswordInput, 'SuperSecretPassword')

      // fire mutation
      const createAccountButton = getByRole('button', {
        name: /Create Account/,
      })
      userEvent.click(createAccountButton)

      // expect error message
      const orgCreationToast = await findByText(/Your account could not be created/)
      await waitFor(() => expect(orgCreationToast).toBeVisible())
    })
  })
})
