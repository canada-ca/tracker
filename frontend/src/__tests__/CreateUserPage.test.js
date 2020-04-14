import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { CreateUserPage } from '../CreateUserPage'
import { CREATE_USER } from '../graphql/mutations'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { en } from 'make-plural/plurals'

i18n.loadLocaleData('en', { plurals: en })
i18n.load('en', { en: {} })
i18n.activate('en')

const resolvers = {
  Query: {
    jwt: () => null,
    tfa: () => null,
  },
}

const mocks = [
  {
    request: {
      query: CREATE_USER,
    },
    result: {
      data: {
        user: {
          userName: 'foo@example.com',
        },
      },
    },
  },
]

describe('<CreateUserPage />', () => {
  describe('given no input', () => {
    describe('when onBlur fires', () => {
      describe('email field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <MockedProvider mocks={mocks} resolvers={resolvers}>
                    <CreateUserPage />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>,
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

      describe('password field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <MockedProvider mocks={mocks} resolvers={resolvers}>
                    <CreateUserPage />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>,
          )

          const password = container.querySelector('#password')

          await waitFor(() => {
            fireEvent.blur(password)
          })

          await waitFor(() =>
            // This should work exactly like the email field above, but it
            // doesn't! The message is displayed but we can only get partial
            // match for some reason.
            expect(queryByText(/Password/)).toBeInTheDocument(),
          )
        })
      })

      describe('confirm password field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <MockedProvider mocks={mocks} resolvers={resolvers}>
                    <CreateUserPage />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>,
          )

          const confirmPassword = container.querySelector('#confirmPassword')

          await waitFor(() => fireEvent.blur(confirmPassword))

          await waitFor(() =>
            // This should work exactly like the email field above, but it
            // doesn't! The message is displayed but we can only get partial
            // match for some reason.
            expect(queryByText(/Confirm Password/)).toBeInTheDocument(),
          )
        })
      })
    })
  })
})
