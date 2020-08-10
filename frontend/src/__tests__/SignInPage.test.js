import React from 'react'
import { createMemoryHistory } from 'history'
import SignInPage from '../SignInPage'
import { SIGN_IN } from '../graphql/mutations'
import { Router, MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { render, waitFor, fireEvent, getByText } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { UserStateProvider } from '../UserState'
import { setupI18n } from '@lingui/core'

describe('<SignInPage />', () => {
  describe('when the email field is empty', () => {
    it('displays an error message', async () => {
      const { container, getByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfa: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <MockedProvider>
                  <SignInPage />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      const email = container.querySelector('#email')

      await waitFor(() => {
        fireEvent.blur(email)
      })

      const errorElement = getByText(/Email cannot be empty/i)

      expect(errorElement.innerHTML).toMatch(/Email cannot be empty/i)
    })
  })

  describe('when the password field is empty', () => {
    it('displays an error message', async () => {
      const { container } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfa: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <MockedProvider>
                  <SignInPage />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      const password = container.querySelector('#password')

      fireEvent.blur(password)

      const errorElement = await waitFor(
        () => getByText(container, /Password cannot be empty/i),
        { container },
      )

      expect(errorElement.innerHTML).toMatch(/Password cannot be empty/i)
    })
  })

  describe('when sign-in succeeds', () => {
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
            },
          },
          result: {
            data: {
              signIn: {
                authenticateToken: values.authenticateToken,
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
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfa: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
              <Router history={history}>
                <MockedProvider mocks={mocks} addTypename={false}>
                  <SignInPage />
                </MockedProvider>
              </Router>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
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
        expect(history.location.pathname).toEqual(
          `/authenticate/${values.authenticateToken}`,
        )
      })
    })
  })
})
