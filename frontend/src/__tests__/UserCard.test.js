import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { UserCard } from '../UserCard'
import { setupI18n } from '@lingui/core'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<UserCard />', () => {
  it('badge is green when TwoFactor value is true', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <UserCard
                userName="testuser@testemail.gc.ca"
                displayName="Test User"
                tfa={true}
                role="USER"
              />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    const tfaBadge = getByText(/2FA Validated/i)
    expect(tfaBadge).toBeDefined()
    expect(tfaBadge).toHaveStyle('background-color: rgb(198, 246, 213)')
  })

  it('badge is red when TwoFactor value is false', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <UserCard
                userName="testuser@testemail.gc.ca"
                displayName="Test User"
                tfa={false}
                role="USER"
              />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    const tfaBadge = getByText(/2FA Validated/i)
    expect(tfaBadge).toBeDefined()
    expect(tfaBadge).toHaveStyle('background-color: rgb(254, 215, 215)')
  })
})
