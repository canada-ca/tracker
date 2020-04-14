import React from 'react'
import { i18n } from '@lingui/core'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'

import { UserCard } from '../UserCard'

// If this unused import, the mocked data test fails.  VERY weird.
import App from '../App'

describe('<UserList />', () => {
  it('successfully renders', async () => {
    const { container } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
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
    expect(container).toBeDefined()
  })
  it('badges are green when TwoFactor and Admin values are true', async () => {
    const { container, getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
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
    expect(container).toBeDefined()

    const tfaBadge = getByText(/TwoFactor/i)
    const adminBadge = getByText(/Admin/i)

    expect(tfaBadge).toBeDefined()
    expect(adminBadge).toBeDefined()

    expect(tfaBadge).toHaveStyle('background-color: rgb(198, 246, 213)')
    expect(adminBadge).toHaveStyle('background-color: rgb(198, 246, 213)')
  })

  it('badges are red when TwoFactor and Admin values are false', async () => {
    const { container, getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
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
    expect(container).toBeDefined()

    const tfaBadge = getByText(/TwoFactor/i)
    const adminBadge = getByText(/Admin/i)

    expect(tfaBadge).toBeDefined()
    expect(adminBadge).toBeDefined()

    expect(tfaBadge).toHaveStyle('background-color: rgb(254, 215, 215)')
    expect(adminBadge).toHaveStyle('background-color: rgb(254, 215, 215)')
  })
})
