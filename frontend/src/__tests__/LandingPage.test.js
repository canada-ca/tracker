import React from 'react'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { LandingPage } from '../LandingPage'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'

describe('<LandingPage />', () => {
  afterEach(cleanup)

  it('renders', () => {
    render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={setupI18n()}>
              <LandingPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </UserStateProvider>,
    )
  })
})
