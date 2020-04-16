import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { DmarcReportTimeGraph } from '../DmarcReportTimeGraph'

describe('<DmarcReportTimeGraph />', () => {
  it('renders correctly', async () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <DmarcReportTimeGraph />
        </I18nProvider>
      </ThemeProvider>,
    )
    await waitFor(() => getByText(/Dmarc Results by Month/i))
  })
})
