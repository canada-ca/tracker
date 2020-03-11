import React from 'react'
import { SignInPage } from '../SignInPage'
import { i18n } from '@lingui/core'
import { MemoryRouter } from 'react-router-dom'
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

describe('<SignInPage />', () => {
  afterEach(cleanup)

  it('successfully renders the component', () => {
    render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <SignInPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(render).toBeTruthy()
  })

  test('an empty input for email field displays an error message', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <SignInPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )

    expect(render).toBeTruthy()

    const email = container.querySelector('#email')

    await wait(() => {
      fireEvent.blur(email)
    })

    const errorElement = await waitForElement(
      () => getByText(container, /Email can not be empty/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Email can not be empty/i)
  })

  test('an empty input for password field displays an error message', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <SignInPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )

    expect(render).toBeTruthy()

    const password = container.querySelector('#password')

    await wait(() => {
      fireEvent.blur(password)
    })

    const errorElement = await waitForElement(
      () => getByText(container, /Password can not be empty/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Password can not be empty/i)
  })

  test('Show/Hide password button toggles properly', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <SignInPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )

    expect(render).toBeTruthy()

    // Get elements that are required for these tests
    const password = container.querySelector('#password')
    const showButton = container.querySelector('#showButton')

    // Assert that inital state is type password & button text is Show
    expect(password).toHaveAttribute('type', 'password')
    expect(showButton.innerHTML).toBe('Show')

    // Click the Show button
    await wait(() => {
      fireEvent.click(showButton)
    })

    // Assert that state after the button press is type text & button text is Hide
    expect(password).toHaveAttribute('type', 'text')
    expect(showButton.innerHTML).toBe('Hide')

    // Click the Hide button
    await wait(() => {
      fireEvent.click(showButton)
    })

    // Assert that third state is type password & button text is Show
    expect(password).toHaveAttribute('type', 'password')
    expect(showButton.innerHTML).toBe('Show')
  })

  test('successful sign-in redirects to home page', async () => {
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
                  failedLoginAttempts
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
              },
              authToken: 'test123stringJWT',
            },
          },
        },
      },
    ]

    const { container } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/sign-in']} initialIndex={0}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <App />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )

    expect(render).toBeTruthy()

    const email = container.querySelector('#email')
    const password = container.querySelector('#password')
    const form = container.querySelector('#form')

    await wait(() => {
      fireEvent.change(email, {
        target: {
          value: values.email,
        },
      })
    })

    await wait(() => {
      fireEvent.change(password, {
        target: {
          value: values.password,
        },
      })
    })

    await wait(() => {
      fireEvent.submit(form)
    })

    const homeHeading = await waitForElement(
      () => getByText(container, /Track web security compliance/i),
      { container },
    )

    expect(homeHeading.innerHTML).toMatch(/Track web security compliance/i)
  })
})
