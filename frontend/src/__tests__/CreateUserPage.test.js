import React from 'react'
import { i18n } from '@lingui/core'
import {
  render,
  cleanup,
  wait,
  waitForElement,
  fireEvent,
  getByText,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloProvider } from '@apollo/react-hooks'
import { CreateUserPage } from '../CreateUserPage'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<SignInPage />', () => {
  afterEach(cleanup)
  const client = new ApolloClient({
    link: createHttpLink({ uri: 'http://0.0.0.0:3000/graphql' }),
    cache: new InMemoryCache(),
  })

  it('successfully renders the component', () => {
    render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <CreateUserPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
    )
    expect(render).toBeTruthy()
  })

  test('an empty input for email field displays an error message', async () => {
    const { container } = render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <CreateUserPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
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
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <CreateUserPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
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
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <CreateUserPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
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
    const { container } = render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <CreateUserPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
    )

    expect(render).toBeTruthy()

    const email = container.querySelector('#email')
    const password = container.querySelector('#password')
    const confirmPassword = container.querySelector('#confirmPassword')
    const form = container.querySelector('#form')

    await wait(() => {
      fireEvent.change(email, {
        target: {
          value: 'testuser@testemail.ca',
        },
      })
    })

    await wait(() => {
      fireEvent.change(password, {
        target: {
          value: 'testuserpassword123',
        },
      })
    })

    await wait(() => {
      fireEvent.change(confirmPassword, {
        target: {
          value: 'testuserpassword123',
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

    //expect(successMsg.innerHTML).toMatch(/Your account has been successfuly created, you may now sign into your account!/i)
  })
})
