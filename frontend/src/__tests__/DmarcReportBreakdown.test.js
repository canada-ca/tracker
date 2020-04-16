import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render, waitFor } from '@testing-library/react'
import { DmarcReportBreakdown } from '../DmarcReportBreakdown'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<DmarcReportBreakdown />', () => {
  it('renders correctly', async () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <DmarcReportBreakdown />
        </I18nProvider>
      </ThemeProvider>,
    )
    await waitFor(() => getByText(/Report Breakdown/i))
  })
})
