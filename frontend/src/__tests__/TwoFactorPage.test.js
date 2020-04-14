import React from 'react'
import gql from 'graphql-tag'
import { TwoFactorPage } from '../TwoFactorPage'
import App from '../App'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { UserStateProvider } from '../UserState'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'
import { i18n } from '@lingui/core'
import { en } from 'make-plural/plurals'

i18n.loadLocaleData('en', { plurals: en })
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

  it('does NOT render component when user has verified tfa', async () => {
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
            tfa: true,
          },
        },
      },
    ]

    const { queryByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'foo@example.com',
          jwt: 'soemestring',
          tfa: true,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} resolvers={resolvers}>
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

    const { queryByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'foo@example.com',
          jwt: 'somestring',
          tfa: false,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} resolvers={resolvers}>
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
