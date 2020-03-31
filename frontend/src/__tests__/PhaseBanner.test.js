import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render } from '@testing-library/react'
import { PhaseBanner } from '../PhaseBanner'

i18n.load('en', { en: {} })
i18n.activate('en')

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
