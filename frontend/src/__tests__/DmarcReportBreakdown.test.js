import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render } from '@testing-library/react'
import { DmarcReportBreakdown } from '../DmarcReportBreakdown'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<DmarcReportBreakdown />', () => {
  it('renders correctly', () => {
    const { getByRole } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <DmarcReportBreakdown />
        </I18nProvider>
      </ThemeProvider>,
    )
  })
})
