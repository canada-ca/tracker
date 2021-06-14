import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { Domain } from '../Domain'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<Domain />', () => {
  it('represents a domain', async () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <Domain lastRan={null} url="canada.ca" data-testid="domain" />
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(getByText('canada.ca')).toBeInTheDocument()
    })
  })
})
