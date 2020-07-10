import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/react-testing'
import { UserStateProvider } from '../UserState'
import ChangePasswordPage from '../ChangePasswordPage'
import { UPDATE_PASSWORD } from '../graphql/mutations'

const mocks = [
  {
    request: {
      query: UPDATE_PASSWORD,
    },
    result: {
      data: {
        status: 'string',
      },
    },
  },
]

describe('<CreateUserPage />', () => {
  describe('given no input', () => {
    describe('when onBlur fires', () => {
      describe('password field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
            <UserStateProvider
              initialState={{ userName: null, jwt: null, tfa: null }}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={setupI18n()}>
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <MockedProvider mocks={mocks}>
                      <ChangePasswordPage />
                    </MockedProvider>
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserStateProvider>,
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
            <UserStateProvider
              initialState={{ userName: null, jwt: null, tfa: null }}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={setupI18n()}>
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <MockedProvider mocks={mocks}>
                      <ChangePasswordPage />
                    </MockedProvider>
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserStateProvider>,
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
