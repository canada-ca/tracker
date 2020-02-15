import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { TopBanner } from '../'
import { render, cleanup } from '@testing-library/react'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<TopBanner />', () => {
  afterEach(cleanup)

  it('renders using the language prop correctly', () => {
    const { getByRole } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <TopBanner lang="en" />
        </I18nProvider>
      </ThemeProvider>,
    )
    const test = getByRole('img')
    expect(test.getAttribute('alt')).toBe(
      'Symbol of the Government of Canada - Symbole du Gouvernement du Canada',
    )
  })
})
