import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import ForgotPasswordPage from '../ForgotPasswordPage'

describe('<CreateUserPage />', () => {
  describe('given no input', () => {
    describe('when onBlur fires', () => {
      describe('email field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
            <UserStateProvider
              initialState={{ userName: null, jwt: null, tfa: null }}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={setupI18n()}>
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <ForgotPasswordPage />
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserStateProvider>,
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
    })
  })
})
