import React from 'react'
import { MemoryRouter, createMemoryRouter, RouterProvider } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import SignInPage from '../SignInPage'
import { UserVarProvider } from '../../utilities/userState'
import { SIGN_IN } from '../../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('<SignInPage />', () => {
  describe('when the email field is empty', () => {
    it('displays an error message', async () => {
      const { container, getByText } = render(
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
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <SignInPage />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const email = container.querySelector('#email')
      fireEvent.blur(email)
      await waitFor(() => {
        expect(getByText(/Email cannot be empty/i)).toBeInTheDocument()
      })
    })
  })

  describe('when the password field is empty', () => {
    it('displays an error message', async () => {
      const { container, getByText } = render(
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
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <SignInPage />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const password = container.querySelector('#password')

      fireEvent.blur(password)

      await waitFor(() => {
        expect(getByText(/Password cannot be empty/i)).toBeInTheDocument()
      })
    })
  })

  describe('when sign-in succeeds', () => {
    describe('and 2fa is enabled', () => {
      it('redirects to authenticate', async () => {
        const values = {
          email: 'testuser@testemail.ca',
          password: 'testuserpassword',
          authenticateToken: 'authenticate-token-test',
        }

        const mocks = [
          {
            request: {
              query: SIGN_IN,
              variables: {
                userName: values.email,
                password: values.password,
                rememberMe: false,
              },
            },
            result: {
              data: {
                signIn: {
                  result: {
                    authenticateToken: values.authenticateToken,
                    sendMethod: 'email',
                    __typename: 'TFASignInResult',
                  },
                },
              },
            },
          },
        ]

        const router = createMemoryRouter(
          [
            {
              path: '/authenticate/email/authenticate-token-test',
              element: <div>Authenticate</div>,
            },
            {
              path: '/sign-in',
              element: <SignInPage />,
            },
          ],
          {
            initialEntries: ['/sign-in'],
            initialIndex: 0,
          },
        )

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
                  <RouterProvider router={router}>
                    <SignInPage />
                  </RouterProvider>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const email = container.querySelector('#email')
        const password = container.querySelector('#password')
        const form = getByRole('form')

        fireEvent.change(email, { target: { value: values.email } })
        fireEvent.change(password, { target: { value: values.password } })
        fireEvent.submit(form)

        await waitFor(() => {
          expect(router.state.location.pathname).toEqual('/authenticate/email/authenticate-token-test')
        })
      })
    })
    describe('and 2fa is NOT enabled', () => {
      it('redirects to home page', async () => {
        const values = {
          email: 'testuser@testemail.ca',
          password: 'testuserpassword',
        }

        const mocks = [
          {
            request: {
              query: SIGN_IN,
              variables: {
                userName: values.email,
                password: values.password,
                rememberMe: false,
              },
            },
            result: {
              data: {
                signIn: {
                  result: {
                    user: {
                      id: '1234asdf',
                      userName: 'Thalia.Rosenbaum@gmail.com',
                      tfaSendMethod: false,
                      emailValidated: true,
                    },
                    authToken: 'test123stringJWT',
                    __typename: 'AuthResult',
                  },
                },
              },
            },
          },
        ]

        const router = createMemoryRouter(
          [
            {
              path: '/',
              element: <div>Landing Page</div>,
            },
            {
              path: '/sign-in',
              element: <SignInPage />,
            },
          ],
          {
            initialEntries: ['/sign-in'],
            initialIndex: 0,
          },
        )

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
                  <RouterProvider router={router}>
                    <SignInPage />
                  </RouterProvider>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const email = container.querySelector('#email')
        const password = container.querySelector('#password')
        const form = getByRole('form')

        fireEvent.change(email, { target: { value: values.email } })
        fireEvent.change(password, { target: { value: values.password } })
        fireEvent.submit(form)

        await waitFor(() => {
          expect(router.state.location.pathname).toEqual('/')
        })
      })
    })
  })

  describe('when sign-in fails', () => {
    describe('server-side error', () => {
      it('displays error', async () => {
        const values = {
          email: 'testuser@testemail.ca',
          password: 'testuserpassword',
          authenticateToken: 'authenticate-token-test',
        }

        const mocks = [
          {
            request: {
              query: SIGN_IN,
              variables: {
                userName: values.email,
                password: values.password,
                rememberMe: false,
              },
            },
            result: {
              error: {
                errors: [{ message: 'errorMessage' }],
              },
            },
          },
        ]

        const { container, getByRole, queryByText } = render(
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
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <SignInPage />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const email = container.querySelector('#email')
        const password = container.querySelector('#password')
        const form = getByRole('form')

        fireEvent.change(email, { target: { value: values.email } })
        fireEvent.change(password, { target: { value: values.password } })
        fireEvent.submit(form)

        await waitFor(() => {
          expect(queryByText(/Unable to sign in to your account, please try again./i))
        })
      })
    })
    describe('client-side error', () => {
      it('displays error', async () => {
        const values = {
          email: 'testuser@testemail.ca',
          password: 'testuserpassword',
          authenticateToken: 'authenticate-token-test',
        }

        const mocks = [
          {
            request: {
              query: SIGN_IN,
              variables: {
                userName: values.email,
                password: values.password,
                rememberMe: false,
              },
            },
            result: {
              description: 'foobar',
              __typename: 'SignInError',
            },
          },
        ]

        const { container, getByRole, queryByText } = render(
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
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <SignInPage />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const email = container.querySelector('#email')
        const password = container.querySelector('#password')
        const form = getByRole('form')

        fireEvent.change(email, { target: { value: values.email } })
        fireEvent.change(password, { target: { value: values.password } })
        fireEvent.submit(form)

        await waitFor(() => {
          expect(queryByText(/Unable to sign in to your account, please try again./i))
          expect(queryByText(/foobar/i))
        })
      })
    })
    describe('incorrect send method', () => {
      it('displays error', async () => {
        const values = {
          email: 'testuser@testemail.ca',
          password: 'testuserpassword',
          authenticateToken: 'authenticate-token-test',
        }

        const mocks = [
          {
            request: {
              query: SIGN_IN,
              variables: {
                userName: values.email,
                password: values.password,
                rememberMe: false,
              },
            },
            result: {
              data: {},
              __typename: 'UnknownError',
            },
          },
        ]

        const { container, getByRole, queryByText } = render(
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
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <SignInPage />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const email = container.querySelector('#email')
        const password = container.querySelector('#password')
        const form = getByRole('form')

        fireEvent.change(email, { target: { value: values.email } })
        fireEvent.change(password, { target: { value: values.password } })
        fireEvent.submit(form)

        await waitFor(() => {
          expect(queryByText(/Incorrect send method received./i))
          expect(queryByText(/Incorrect signIn.result typename./i))
        })
      })
    })
  })
})
