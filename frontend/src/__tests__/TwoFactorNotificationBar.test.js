import React from 'react'
import { i18n } from '@lingui/core'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { render, cleanup, queryByText } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import gql from 'graphql-tag'
import App from '../App'
import { TwoFactorNotificationBar } from '../TwoFactorNotificationBar'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<TwoFactorNotificationBar />', () => {
  afterEach(cleanup)

  it('successfully renders the component on its own.', () => {
    render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <TwoFactorNotificationBar />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(render).toBeTruthy()
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

    const { container } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider mocks={mocks}>
              <App />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(render).toBeTruthy()

    const tfaBar = queryByText(
      container,
      /You have not enabled Two Factor Authentication./i,
    )
    expect(tfaBar).toBeDefined()
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

    const { container } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider mocks={mocks}>
              <App />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(render).toBeTruthy()

    const tfaBar = queryByText(
      container,
      /You have not enabled Two Factor Authentication./i,
    )
    expect(tfaBar).toBe(null)
  })
})
