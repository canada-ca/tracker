import React from 'react'
import { i18n } from '@lingui/core'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { LandingPage } from '../LandingPage'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<LandingPage />', () => {
  afterEach(cleanup)

  it('renders', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <LandingPage />
          </I18nProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )
  })
})
