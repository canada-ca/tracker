import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { TopBanner } from '../TopBanner'
import { render, cleanup } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
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

describe('<TopBanner />', () => {
  afterEach(cleanup)

  it('renders using the language prop correctly', () => {
    const { getByAltText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <TopBanner lang="en" />
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(getByAltText('Symbol of the Government of Canada'))
  })
})
