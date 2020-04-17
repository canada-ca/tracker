import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render, waitFor } from '@testing-library/react'
import { DmarcReportGuidance } from '../DmarcReportGuidance'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<DmarcReportGuidance />', () => {
  it('renders correctly', async () => {
    const { getAllByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <DmarcReportGuidance />
        </I18nProvider>
      </ThemeProvider>,
    )
    await waitFor(() => getAllByText(/Guidance/i))

  })
})
