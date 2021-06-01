import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MockedProvider } from '@apollo/client/testing'
import { SEND_PASSWORD_RESET_LINK } from '../graphql/mutations'
import ForgotPasswordPage from '../ForgotPasswordPage'

const mocks = [
  {
    request: {
      query: SEND_PASSWORD_RESET_LINK,
    },
    result: {
      data: {
        status: 'string',
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
    en: {},
  },
})

describe('<ForgotPasswordPage />', () => {
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
                      <ForgotPasswordPage />
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
    })
  })
})
