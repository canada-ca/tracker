import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
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
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <Domain lastRan={null} url="canada.ca" data-testid="domain" />
          </MemoryRouter>
        </I18nProvider>
      </ChakraProvider>,
    )

    await waitFor(() => {
      expect(getByText('canada.ca')).toBeInTheDocument()
    })
  })
})
