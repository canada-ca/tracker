import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { DmarcReportGraph } from '../DmarcReportGraph'

describe('<DmarcReportGraph />', () => {
  it('renders correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <DmarcReportGraph />
        </I18nProvider>
      </ThemeProvider>,
    )
  })
})
