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

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const failMocks = [
  {
    request: {
      query: RESET_PASSWORD,
      variables: {
        password: 'newPassword1',
        confirmPassword: 'newPassword1',
        resetToken: 'fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe',
      },
    },
    result: {
      data: {
        resetPassword: {
          result: {
            code: -89,
            description: 'Hello World',
            __typename: 'ResetPasswordError',
          },
        },
      },
    },
  },
]

const successMocks = [
  {
    request: {
      query: RESET_PASSWORD,
      variables: {
        password: 'newPassword1',
        confirmPassword: 'newPassword1',
        resetToken: 'fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe',
      },
    },
    result: {
      data: {
        resetPassword: {
          result: {
            status: 'Hello World',
            __typename: 'ResetPasswordResult',
          },
        },
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
            <UserStateProvider
              initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MockedProvider mocks={successMocks}>
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
            </UserStateProvider>,
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
            <UserStateProvider
              initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MockedProvider mocks={successMocks}>
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
            </UserStateProvider>,
          )

          const confirmPassword = container.querySelector('#confirmPassword')

          await waitFor(() => fireEvent.blur(confirmPassword))

          await waitFor(() =>
            expect(queryByText(/Password confirmation/)).toBeInTheDocument(),
          )
        })
      })
    })
  })

  describe('given input', () => {
    it('succeeds in reseting the password', async () => {
      const { container, queryByText, getByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MockedProvider mocks={successMocks}>
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
        </UserStateProvider>,
      )

      const password = container.querySelector('#password')
      const confirmPassword = container.querySelector('#confirmPassword')
      const submitBtn = getByText(/Change Password/)

      await waitFor(() => {
        fireEvent.change(password, { target: { value: 'newPassword1' } })
        fireEvent.change(confirmPassword, { target: { value: 'newPassword1' } })
        fireEvent.click(submitBtn)
        expect(queryByText(/Password Updated/i)).toBeInTheDocument()
      })
    })

    it('fails in reseting the password', async () => {
      const { container, queryByText, getByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MockedProvider mocks={failMocks}>
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
        </UserStateProvider>,
      )

      const password = container.querySelector('#password')
      const confirmPassword = container.querySelector('#confirmPassword')
      const submitBtn = getByText(/Change Password/)

      await waitFor(() => {
        fireEvent.change(password, { target: { value: 'newPassword1' } })
        fireEvent.change(confirmPassword, { target: { value: 'newPassword1' } })
        fireEvent.click(submitBtn)
        expect(
          queryByText(/Unable to reset your password, please try again./i),
        ).toBeInTheDocument()
      })
    })
  })
})
