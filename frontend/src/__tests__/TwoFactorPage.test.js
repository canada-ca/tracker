import React from 'react'
import gql from 'graphql-tag'
import { TwoFactorPage } from '../TwoFactorPage'
import { i18n } from '@lingui/core'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'

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
  it('an empty input for code field displays an error message', async () => {
    const { container, queryByText } = render(
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

    await waitFor(() => {
      fireEvent.blur(otpCode)
    })

    await waitFor(() =>
      expect(queryByText(/Field can not be empty/i)).toBeInTheDocument(),
    )
  })

  it('5 digit code displays an error message', async () => {
    const { container, queryByText } = render(
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

    await waitFor(() => {
      fireEvent.change(otpCode, { target: { value: '12345' } })
    })

    expect(otpCode.value).toBe('12345')

    await waitFor(() => {
      fireEvent.blur(otpCode)
    })

    await waitFor(() =>
      expect(queryByText(/Code must be six characters/i)).toBeInTheDocument(),
    )
  })

  it('non digit code displays an error message', async () => {
    const { container, queryByText } = render(
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

    await waitFor(() => {
      fireEvent.change(otpCode, { target: { value: 'grapefruit' } })
    })

    expect(otpCode.value).toBe('grapefruit')

    await waitFor(() => {
      fireEvent.blur(otpCode)
    })

    await waitFor(() =>
      expect(queryByText(/Code must be numbers only/i)).toBeInTheDocument(),
    )
  })

  it('6 digit code does not display an error message', async () => {
    const { container, queryByText } = render(
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

    await waitFor(() => {
      fireEvent.change(otpCode, { target: { value: '654321' } })
    })

    expect(otpCode.value).toBe('654321')

    await waitFor(() => fireEvent.blur(otpCode))

    await waitFor(() => {
      expect(queryByText(/Field can not be empty/i)).toBe(null)
      expect(queryByText(/Code must be numbers only/i)).toBe(null)
      expect(queryByText(/Code must be six characters/i)).toBe(null)
    })
  })
})
