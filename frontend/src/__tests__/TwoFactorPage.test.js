import React from 'react'
import { TwoFactorPage } from '../TwoFactorPage'
import App from '../App'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { UserStateProvider } from '../UserState'
import { WEB_AND_EMAIL_SUMMARIES } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { setupI18n } from '@lingui/core'

const mocks = [
  {
    request: {
      query: WEB_AND_EMAIL_SUMMARIES,
    },
    result: {
      data: {
        webSummary: {
          categories: [
            {
              name: 'full-pass',
              count: 1214,
              percentage: 13.5,
            },
            {
              name: 'full-fail',
              count: 7798,
              percentage: 86.5,
            },
          ],
          total: 9012,
        },
        emailSummary: {
          categories: [
            {
              name: 'full-pass',
              count: 5872,
              percentage: 25.5,
            },
            {
              name: 'full-fail',
              count: 9949,
              percentage: 43.2,
            },
            {
              name: 'partial-pass',
              count: 7216,
              percentage: 31.3,
            },
          ],
          total: 23037,
        },
      },
    },
  },
]

describe('<TwoFactorPage />', () => {
  it('an empty input for code field displays an error message', async () => {
    const { container, queryByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
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
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
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
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
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

  it('does NOT render component when user has verified tfa', async () => {
    const { queryByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'foo@example.com',
          jwt: 'soemestring',
          tfa: true,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <App />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    const tfaBar = await waitFor(() =>
      queryByText(/You have not enabled Two Factor Authentication./i),
    )
    expect(tfaBar).toBe(null)
  })

  it('successfully renders the component as part of the entire App when user has not verified tfa', async () => {
    const { queryByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'foo@example.com',
          jwt: 'somestring',
          tfa: false,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <App />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    const tfaBar = await waitFor(() =>
      queryByText(/You have not enabled Two Factor Authentication./i),
    )
    expect(tfaBar).toBeDefined()
  })

  it('6 digit code does not display an error message', async () => {
    const { container, queryByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
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
