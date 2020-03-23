import React from 'react'
import { createMemoryHistory } from 'history'
import { SignInPage } from '../SignInPage'
import { i18n } from '@lingui/core'
import { Router, MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import {
  render,
  cleanup,
  wait,
  waitForElement,
  fireEvent,
  getByText,
} from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import gql from 'graphql-tag'
import App from '../App'

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
      query: gql`
        {
          domains(organization: BOC) {
            url
          }
        }
      `,
      variables: {},
    },
    result: {
      data: {
        domains: [
          {
            url: 'canada.ca',
          },
          {
            url: 'alpha.canada.ca',
          },
        ],
      },
    },
  },
]

describe('<SignInPage />', () => {
  afterEach(cleanup)

  describe('when the email field is empty', () => {
    it('displays an error message', async () => {
      const { container, getByText } = render(
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider resolvers={resolvers} mocks={mocks}>
                <SignInPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>,
      )

      const email = container.querySelector('#email')

      await wait(() => {
        fireEvent.blur(email)
      })

      const errorElement = getByText(/Email cannot be empty/i)

      expect(errorElement.innerHTML).toMatch(/Email cannot be empty/i)
    })
  })

  describe('when the password field is empty', () => {
    it('displays an error message', async () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider
                resolvers={resolvers}
                mocks={mocks}
                addTypename={false}
              >
                <SignInPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>,
      )

      const password = container.querySelector('#password')

      fireEvent.blur(password)

      const errorElement = await waitForElement(
        () => getByText(container, /Password cannot be empty/i),
        { container },
      )

      expect(errorElement.innerHTML).toMatch(/Password cannot be empty/i)
    })
  })

  describe('when sign-in succeeds', () => {
    it('redirects to home page', async () => {
      const values = {
        email: 'testuser@testemail.ca',
        password: 'testuserpassword',
      }

      const mocks = [
        {
          request: {
            query: gql`
              mutation SignIn($userName: EmailAddress!, $password: String!) {
                signIn(userName: $userName, password: $password) {
                  user {
                    userName
                    tfaValidated
                  }
                  authToken
                }
              }
            `,
            variables: {
              userName: values.email,
              password: values.password,
            },
          },
          result: {
            data: {
              signIn: {
                user: {
                  userName: 'Thalia.Rosenbaum@gmail.com',
                  failedLoginAttempts: 4,
                  tfaValidated: false,
                },
                authToken: 'test123stringJWT',
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
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <Router history={history}>
              <MockedProvider
                resolvers={resolvers}
                mocks={mocks}
                addTypename={false}
              >
                <App />
              </MockedProvider>
            </Router>
          </I18nProvider>
        </ThemeProvider>,
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

      await wait(() => {
        expect(history.location.pathname).toEqual('/')
      })
    })
  })
})
