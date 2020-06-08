import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { Domain } from '../Domain'

describe('<Domain />', () => {
  it('represents a domain', async () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
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
