import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import TwoFactorAuthenticatePage from '../TwoFactorAuthenticatePage'

import { UserVarProvider } from '../../utilities/userState'
import { AUTHENTICATE } from '../../graphql/mutations'

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
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <div>Landing Page</div>,
        },
        {
          path: '/authenticate/:sendMethod/:authenticateToken',
          element: <TwoFactorAuthenticatePage />,
        },
      ],
      {
        initialEntries: ['/authenticate/phone/authenticate-token-test'],
        initialIndex: 0,
      },
    )

    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <RouterProvider router={router}>
                <TwoFactorAuthenticatePage />
              </RouterProvider>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => expect(getByText(/Two Factor Authentication/)).toBeInTheDocument())
  })

  describe('given no input', () => {
    describe('when the form is submitted', () => {
      describe('two factor code input', () => {
        it('displays an error message', async () => {
          const router = createMemoryRouter(
            [
              {
                path: '/',
                element: <div>Landing Page</div>,
              },
              {
                path: '/authenticate/:sendMethod/:authenticateToken',
                element: <TwoFactorAuthenticatePage />,
              },
            ],
            {
              initialEntries: ['/authenticate/phone/authenticate-token-test'],
              initialIndex: 0,
            },
          )

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
                    <RouterProvider router={router}>
                      <TwoFactorAuthenticatePage />
                    </RouterProvider>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )
          const submitButton = getByText('Submit')
          fireEvent.click(submitButton)

          await waitFor(() => {
            expect(getByText(/Code field must not be empty/i)).toBeInTheDocument()
          })
        })
      })
    })
  })

  describe('when authentication fails', () => {
    it('server-side error', async () => {
      const values = {
        authenticateToken: 'authenticate-token-test',
        authenticationCode: 123456,
      }

      const mocks = [
        {
          request: {
            query: AUTHENTICATE,
            variables: {
              sendMethod: 'PHONE',
              authenticateToken: values.authenticateToken,
              authenticationCode: values.authenticationCode,
            },
          },
          result: {
            error: {
              errors: [{ message: 'error' }],
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
            path: '/authenticate/:sendMethod/:authenticateToken',
            element: <TwoFactorAuthenticatePage />,
          },
        ],
        {
          initialEntries: ['/authenticate/phone/authenticate-token-test'],
          initialIndex: 0,
        },
      )

      const { getAllByRole, getByRole, queryByText } = render(
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
                  <TwoFactorAuthenticatePage />
                </RouterProvider>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const twoFactorCode = getAllByRole('textbox', { name: 'Please enter your pin code' })[0]
      const form = getByRole('form')

      fireEvent.change(twoFactorCode, {
        target: {
          value: values.authenticationCode,
        },
      })

      fireEvent.submit(form)

      await waitFor(() => {
        expect(queryByText(/Unable to sign in to your account, please try again./i))
      })
    })
    it('client-side error', async () => {
      const values = {
        authenticateToken: 'authenticate-token-test',
        authenticationCode: 123456,
      }

      const mocks = [
        {
          request: {
            query: AUTHENTICATE,
            variables: {
              sendMethod: 'PHONE',
              authenticateToken: values.authenticateToken,
              authenticationCode: values.authenticationCode,
            },
          },
          result: {
            data: {
              authenticate: {
                result: {
                  code: 52,
                  description: 'Hello World',
                  __typename: 'AuthenticateError',
                },
                __typename: 'AuthenticatePayload',
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
            path: '/authenticate/:sendMethod/:authenticateToken',
            element: <TwoFactorAuthenticatePage />,
          },
        ],
        {
          initialEntries: ['/authenticate/phone/authenticate-token-test'],
          initialIndex: 0,
        },
      )

      const { getAllByRole, getByRole, queryByText } = render(
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
                  <TwoFactorAuthenticatePage />
                </RouterProvider>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const twoFactorCode = getAllByRole('textbox', { name: 'Please enter your pin code' })[0]
      const form = getByRole('form')

      fireEvent.change(twoFactorCode, {
        target: {
          value: values.authenticationCode,
        },
      })

      fireEvent.submit(form)

      await waitFor(() => {
        expect(queryByText(/Hello World/i))
      })
    })
    it('type error', async () => {
      const values = {
        authenticateToken: 'authenticate-token-test',
        authenticationCode: 123456,
      }

      const mocks = [
        {
          request: {
            query: AUTHENTICATE,
            variables: {
              sendMethod: 'PHONE',
              authenticateToken: values.authenticateToken,
              authenticationCode: values.authenticationCode,
            },
          },
          result: {
            data: {
              authenticate: {
                result: {
                  code: 52,
                  description: 'Hello World',
                  __typename: 'AuthenticateError',
                },
                __typename: 'AuthenticatePayload',
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
            path: '/authenticate/:sendMethod/:authenticateToken',
            element: <TwoFactorAuthenticatePage />,
          },
        ],
        {
          initialEntries: ['/authenticate/phone/authenticate-token-test'],
          initialIndex: 0,
        },
      )

      const { getAllByRole, getByRole, queryByText } = render(
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
                  <TwoFactorAuthenticatePage />
                </RouterProvider>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const twoFactorCode = getAllByRole('textbox', { name: 'Please enter your pin code' })[0]
      const form = getByRole('form')

      fireEvent.change(twoFactorCode, {
        target: {
          value: values.authenticationCode,
        },
      })

      fireEvent.submit(form)

      await waitFor(() => {
        expect(queryByText(/Incorrect send method received./i))
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
              sendMethod: 'PHONE',
              authenticateToken: values.authenticateToken,
              authenticationCode: values.authenticationCode,
            },
          },
          result: {
            data: {
              authenticate: {
                result: {
                  user: {
                    id: '1234asdf',
                    userName: 'Thalia.Rosenbaum@gmail.com',
                    tfaSendMethod: 'PHONE',
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
            path: '/authenticate/:sendMethod/:authenticateToken',
            element: <TwoFactorAuthenticatePage />,
          },
        ],
        {
          initialEntries: ['/authenticate/phone/authenticate-token-test'],
          initialIndex: 0,
        },
      )

      const { getAllByRole, getByRole } = render(
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
                  <TwoFactorAuthenticatePage />
                </RouterProvider>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const twoFactorCode = getAllByRole('textbox', { name: 'Please enter your pin code' })[0]
      const form = getByRole('form')

      fireEvent.change(twoFactorCode, {
        target: {
          value: values.authenticationCode,
        },
      })

      fireEvent.submit(form)

      await waitFor(() => {
        expect(router.state.location.pathname).toEqual('/')
      })
    })
  })
})
