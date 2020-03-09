import React from 'react'
import { TwoFactorPage } from '../TwoFactorPage'
import { i18n } from '@lingui/core'
import {
  render,
  cleanup,
  wait,
  waitForElement,
  fireEvent,
  getByText,
  queryByText,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import ApolloClient from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import fetch from 'isomorphic-unfetch'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloProvider } from '@apollo/react-hooks'
import userEvent from '@testing-library/user-event'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<TwoFactorPage />', () => {
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
              <TwoFactorPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
    )
    expect(render).toBeTruthy()
  })

  test('an empty input for code field displays an error message', async () => {
    const { container } = render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <TwoFactorPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
    )

    expect(render).toBeTruthy()

    const otpCode = container.querySelector('#otpCode')

    await wait(() => {
      fireEvent.blur(otpCode)
    })

    const errorElement = await waitForElement(
      () => getByText(container, /Field can not be empty/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Field can not be empty/i)
  })

  test('5 digit code displays an error message', async () => {
    const { container } = render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <TwoFactorPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
    )

    expect(render).toBeTruthy()

    const otpCode = container.querySelector('#otpCode')

    await wait(() => {
      userEvent.type(otpCode, '12345')
    })

    expect(otpCode.value).toBe('12345')

    await wait(() => {
      fireEvent.blur(otpCode)
    })

    const errorElement = await waitForElement(
      () => getByText(container, /Code must be six characters/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Code must be six characters/i)
  })

  test('non digit code displays an error message', async () => {
    const { container } = render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <TwoFactorPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
    )

    expect(render).toBeTruthy()

    const otpCode = container.querySelector('#otpCode')

    await wait(() => {
      userEvent.type(otpCode, 'grapefruit')
    })

    expect(otpCode.value).toBe('grapefruit')

    await wait(() => {
      fireEvent.blur(otpCode)
    })

    const errorElement = await waitForElement(
      () => getByText(container, /Code must be numbers only/i),
      { container },
    )

    expect(errorElement.innerHTML).toMatch(/Code must be numbers only/i)
  })

  test('6 digit code does not display an error message', async () => {
    const { container } = render(
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <TwoFactorPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </ApolloProvider>,
    )

    expect(render).toBeTruthy()

    const otpCode = container.querySelector('#otpCode')

    await wait(() => {
      userEvent.type(otpCode, '654321')
    })

    expect(otpCode.value).toBe('654321')

    await wait(() => {
      fireEvent.blur(otpCode)
    })

    expect(queryByText(container, /Field can not be empty/i)).toBe(null)
    expect(queryByText(container, /Code must be numbers only/i)).toBe(null)
    expect(queryByText(container, /Code must be six characters/i)).toBe(null)
  })
})
