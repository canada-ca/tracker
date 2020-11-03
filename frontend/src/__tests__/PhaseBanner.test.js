import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render } from '@testing-library/react'
import { PhaseBanner } from '../PhaseBanner'
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

describe('<PhaseBanner />', () => {
  it('properly renders alpha banner', async () => {
    const { queryByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <PhaseBanner phase="ALPHA" />
        </I18nProvider>
      </ThemeProvider>,
    )

    expect(queryByText(/ALPHA/)).toBeInTheDocument()
  })
})
