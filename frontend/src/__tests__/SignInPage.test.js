import React from 'react'
import { SignInPage } from '../SignInPage'
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
import fetch from 'isomorphic-unfetch'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloProvider } from '@apollo/react-hooks'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<SignInPage />', () => {
  afterEach(cleanup)

  const client = new ApolloClient({
    link: createHttpLink({ fetch }),
    cache: new InMemoryCache(),
  })

  it('successfully renders the component', () => {
    render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <SignInPage />
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
              <SignInPage />
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
      () => getByText(container, /Field can not be empty/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Field can not be empty/i)
  })

  test('an empty input for password field displays an error message', async () => {
    const { container } = render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <SignInPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
    )

    expect(render).toBeTruthy()

    const password = container.querySelector('#password')

    await wait(() => {
      fireEvent.blur(email)
    })

    const errorElement = await waitForElement(
      () => getByText(container, /Field can not be empty/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Field can not be empty/i)
  })

  test('Show/Hide password button toggles properly', async () => {
    const { container } = render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <SignInPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
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
})
