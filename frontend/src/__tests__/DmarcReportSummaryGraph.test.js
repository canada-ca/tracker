import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import DmarcTimeGraph from '../DmarcReportSummaryGraph'
import { formattedBarData } from '../fixtures/summaryListData'

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
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <DmarcTimeGraph data={formattedBarData} responsiveWidth={500} />
        </I18nProvider>
      </ChakraProvider>,
    )
    await waitFor(() => getByText(/Fail DKIM/i))
  })
})
