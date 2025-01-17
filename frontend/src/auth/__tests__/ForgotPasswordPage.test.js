import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import ForgotPasswordPage from '../../auth/ForgotPasswordPage'

import { UserVarProvider } from '../../utilities/userState'
import { SEND_PASSWORD_RESET_LINK } from '../../graphql/mutations'

const mocks = [
  {
    request: {
      query: SEND_PASSWORD_RESET_LINK,
      variables: { userName: 'user@test.ca' },
    },
    result: {
      data: {
        sendPasswordResetLink: {
          status: 'Hello World',
          __typename: 'SendPasswordResetLinkPayload',
        },
      },
    },
  },
]

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('<ForgotPasswordPage />', () => {
  describe('given no input', () => {
    describe('when onBlur fires', () => {
      describe('email field', () => {
        it('displays an error message', async () => {
          const router = createMemoryRouter(
            [
              {
                path: '/forgot-password',
                element: <ForgotPasswordPage />,
              },
            ],
            {
              // Set for where you want to start in the routes. Remember, KISS (Keep it simple, stupid) the routes.
              initialEntries: ['/forgot-password'],
              // We don't need to explicitly set this, but it's nice to have.
              initialIndex: 0,
            },
          )
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
                    <RouterProvider router={router}>
                      <ForgotPasswordPage />
                    </RouterProvider>
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
    })
  })

  describe('when given correct input', () => {
    it('successfully submits', async () => {
      const router = createMemoryRouter(
        [
          {
            path: '/',
            element: <div />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
          },
        ],
        {
          // Set for where you want to start in the routes. Remember, KISS (Keep it simple, stupid) the routes.
          initialEntries: ['/forgot-password'],
          // We don't need to explicitly set this, but it's nice to have.
          initialIndex: 0,
        },
      )
      const { container, queryByText, getByText } = render(
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
                  <ForgotPasswordPage />
                </RouterProvider>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const email = container.querySelector('#email')
      const submitBtn = getByText(/Submit/)
      fireEvent.change(email, { target: { value: 'user@test.ca' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(queryByText(/An email was sent with a link to reset your password/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(router.state.location.pathname).toEqual('/')
      })
    })
  })
})
