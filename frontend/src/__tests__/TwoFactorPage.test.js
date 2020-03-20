import React from 'react'
import gql from 'graphql-tag'
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
import { MockedProvider } from '@apollo/react-testing'
import userEvent from '@testing-library/user-event'

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
          jwt @client
          tfa @client
        }
      `,
    },
    result: {
      data: {
        jwt: 'string',
        tfa: false,
      },
    },
  },
]

describe('<TwoFactorPage />', () => {
  afterEach(cleanup)

  it('an empty input for code field displays an error message', async () => {
    const { container } = render(
      <MockedProvider mocks={mocks} resolvers={resolvers}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <TwoFactorPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

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

  it('5 digit code displays an error message', async () => {
    const { container } = render(
      <MockedProvider mocks={mocks} resolvers={resolvers}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <TwoFactorPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

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

  it('non digit code displays an error message', async () => {
    const { container } = render(
      <MockedProvider mocks={mocks} resolvers={resolvers}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <TwoFactorPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

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
      <MockedProvider mocks={mocks} resolvers={resolvers}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <TwoFactorPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    const otpCode = container.querySelector('#otpCode')

    await wait(() => {
      userEvent.type(otpCode, '654321')
    })

    expect(otpCode.value).toBe('654321')

    fireEvent.blur(otpCode)

    await wait(() => {
      expect(queryByText(container, /Field can not be empty/i)).toBe(null)
      expect(queryByText(container, /Code must be numbers only/i)).toBe(null)
      expect(queryByText(container, /Code must be six characters/i)).toBe(null)
    })
  })
})
