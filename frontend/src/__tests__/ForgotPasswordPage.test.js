import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { MemoryRouter, Route, Router, Switch } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MockedProvider } from '@apollo/client/testing'
import { SEND_PASSWORD_RESET_LINK } from '../graphql/mutations'
import ForgotPasswordPage from '../ForgotPasswordPage'
import { createMemoryHistory } from 'history'

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
                    <MemoryRouter
                    initialEntries={['/forgot-password']}
                    initialIndex={0}
                  >
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

  describe('when given correct input', () => {
    const history = createMemoryHistory({
      initialEntries: ['/forgot-password'],
      initialIndex: 0,
    })

    it('successfully submits', async () => {
      const { container, queryByText, getByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter
                initialEntries={['/forgot-password']}
                initialIndex={0}
              >
                <MockedProvider mocks={mocks}>
                  <Router history={history}>
                    <Switch>
                      <Route
                        path="/forgot-password"
                        render={() => <ForgotPasswordPage />}
                      />
                    </Switch>
                  </Router>
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      const email = container.querySelector('#email')
      const submitBtn = getByText(/Submit/)
      fireEvent.change(email, { target: { value: 'user@test.ca' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(
          queryByText(/An email was sent with a link to reset your password/i),
        ).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(history.location.pathname).toEqual('/')
      })
    })
  })
})
