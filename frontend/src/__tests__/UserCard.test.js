import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'
import { UserCard } from '../UserCard'
import { setupI18n } from '@lingui/core'

describe('<UserCard />', () => {
  it('badges are green when TwoFactor and Admin values are true', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
              <UserCard
                userName="testuser@testemail.gc.ca"
                displayName="Test User"
                tfa={true}
                admin={true}
              />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    const tfaBadge = getByText(/TwoFactor/i)
    const adminBadge = getByText(/Admin/i)

    expect(tfaBadge).toBeDefined()
    expect(adminBadge).toBeDefined()

    expect(tfaBadge).toHaveStyle('background-color: rgb(198, 246, 213)')
    expect(adminBadge).toHaveStyle('background-color: rgb(198, 246, 213)')
  })

  it('badges are red when TwoFactor and Admin values are false', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
              <UserCard
                userName="testuser@testemail.gc.ca"
                displayName="Test User"
                tfa={false}
                admin={false}
              />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    const tfaBadge = getByText(/TwoFactor/i)
    const adminBadge = getByText(/Admin/i)

    expect(tfaBadge).toBeDefined()
    expect(adminBadge).toBeDefined()

    expect(tfaBadge).toHaveStyle('background-color: rgb(254, 215, 215)')
    expect(adminBadge).toHaveStyle('background-color: rgb(254, 215, 215)')
  })
})
