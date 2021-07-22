import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { DmarcReportSummaryGraph } from '../DmarcReportSummaryGraph'
import { formattedBarData } from '../fixtures/summaryListData'

// ** need to mock the ResizeObserver and polute the window object to avoid errors
class ResizeObserver {
  observe() {
    // do nothing
  }

  unobserve() {
    // do nothing
  }

  disconnect() {
    // do nothing
  }
}

window.ResizeObserver = ResizeObserver
// **

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<DmarcReportTimeGraph />', () => {
  it('renders correctly', async () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <DmarcReportSummaryGraph data={formattedBarData} />
        </I18nProvider>
      </ThemeProvider>,
    )
    await waitFor(() => getByText(/Fail DKIM/i))
  })
})
