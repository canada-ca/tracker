import React from 'react'
import { createMemoryHistory } from 'history'
import { MemoryRouter, Router } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { fireEvent, getByText, render, waitFor } from '@testing-library/react'
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
      const { container } = render(
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

      const errorElement = await waitFor(() => getByText(container, /Password cannot be empty/i), { container })

      expect(errorElement.innerHTML).toMatch(/Password cannot be empty/i)
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

        // create a history object and inject it so we can inspect it afterwards
        // for the side effects of our form submission (a redirect to /!).
        const history = createMemoryHistory({
          initialEntries: ['/sign-in'],
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
                    <SignInPage />
                  </Router>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const email = container.querySelector('#email')
        const password = container.querySelector('#password')
        const form = getByRole('form')

        fireEvent.change(email, {
          target: {
            value: values.email,
          },
        })

        fireEvent.change(password, {
          target: {
            value: values.password,
          },
        })

        fireEvent.submit(form)

        await waitFor(() => {
          expect(history.location.pathname).toEqual(`/authenticate/email/${values.authenticateToken}`)
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

        // create a history object and inject it so we can inspect it afterwards
        // for the side effects of our form submission (a redirect to /!).
        const history = createMemoryHistory({
          initialEntries: ['/sign-in'],
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
                    <SignInPage />
                  </Router>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const email = container.querySelector('#email')
        const password = container.querySelector('#password')
        const form = getByRole('form')

        fireEvent.change(email, {
          target: {
            value: values.email,
          },
        })

        fireEvent.change(password, {
          target: {
            value: values.password,
          },
        })

        fireEvent.submit(form)

        await waitFor(() => {
          expect(history.location.pathname).toEqual('/')
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

        // create a history object and inject it so we can inspect it afterwards
        // for the side effects of our form submission (a redirect to /!).
        const history = createMemoryHistory({
          initialEntries: ['/sign-in'],
          initialIndex: 0,
        })

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
                  <Router history={history}>
                    <SignInPage />
                  </Router>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const email = container.querySelector('#email')
        const password = container.querySelector('#password')
        const form = getByRole('form')

        fireEvent.change(email, {
          target: {
            value: values.email,
          },
        })

        fireEvent.change(password, {
          target: {
            value: values.password,
          },
        })

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

        // create a history object and inject it so we can inspect it afterwards
        // for the side effects of our form submission (a redirect to /!).
        const history = createMemoryHistory({
          initialEntries: ['/sign-in'],
          initialIndex: 0,
        })

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
                  <Router history={history}>
                    <SignInPage />
                  </Router>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const email = container.querySelector('#email')
        const password = container.querySelector('#password')
        const form = getByRole('form')

        fireEvent.change(email, {
          target: {
            value: values.email,
          },
        })

        fireEvent.change(password, {
          target: {
            value: values.password,
          },
        })

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

        // create a history object and inject it so we can inspect it afterwards
        // for the side effects of our form submission (a redirect to /!).
        const history = createMemoryHistory({
          initialEntries: ['/sign-in'],
          initialIndex: 0,
        })

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
                  <Router history={history}>
                    <SignInPage />
                  </Router>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const email = container.querySelector('#email')
        const password = container.querySelector('#password')
        const form = getByRole('form')

        fireEvent.change(email, {
          target: {
            value: values.email,
          },
        })

        fireEvent.change(password, {
          target: {
            value: values.password,
          },
        })

        fireEvent.submit(form)

        await waitFor(() => {
          expect(queryByText(/Incorrect send method received./i))
          expect(queryByText(/Incorrect signIn.result typename./i))
        })
      })
    })
  })
})
