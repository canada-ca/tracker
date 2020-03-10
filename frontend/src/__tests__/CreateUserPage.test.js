import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import {
  render,
  cleanup,
  wait,
  waitForElement,
  fireEvent,
  getByText,
  queryByText,
} from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { CreateUserPage } from '../CreateUserPage'
import gql from 'graphql-tag'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<CreateUserPage />', () => {
  afterEach(cleanup)

  it('successfully renders the component', () => {
    render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <CreateUserPage />
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
              <CreateUserPage />
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
              <CreateUserPage />
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

  test('an empty input for confirm password field displays an error message', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <CreateUserPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )

    expect(render).toBeTruthy()

    const confirmPassword = container.querySelector('#confirmPassword')

    await wait(() => {
      fireEvent.blur(confirmPassword)
    })

    const errorElement = await waitForElement(
      () => getByText(container, /Confirm Password can not be empty/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Confirm Password can not be empty/i)
  })

  test('successful creation of a new user results in proper message being displayed', async () => {
    
    const values = {
      email: 'testuser@testemail.ca',
      password: 'testuserpassword',
      confirmPassword: 'testuserpassword',
    }

    const mocks = [
      {
        request: {
          query: gql`
          mutation CreateUser($displayName: String!, $userName: EmailAddress!, $password: String!, $confirmPassword: String!) {
            createUser(displayName: $displayName, userName: $userName, password: $password, confirmPassword: $confirmPassword) {
              user {
                userName
              }
            }
          }
          `,
          variables: {
            userName: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
            displayName: values.email,
          },
        },
        result: {
          data: {
            createUser: {
              user: {
                userName: 'Thalia.Rosenbaum@gmail.com',
              },
            },
          },
        },
      },
    ]
    const { container } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <CreateUserPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(render).toBeTruthy()

    const email = container.querySelector('#email')
    const password = container.querySelector('#password')
    const confirmPassword = container.querySelector('#confirmPassword')
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
      fireEvent.change(confirmPassword, {
        target: {
          value: values.confirmPassword,
        },
      })
    })

    await wait(() => {
      fireEvent.submit(form)
    })

    const successMsg = await waitForElement(
      () => getByText(container, /Your account has been successfuly created/i),
      { container },
    )

    expect(successMsg.innerHTML).toMatch(
      /Your account has been successfuly created, you may now sign into your account!/i,
    )
  })
})
