import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import DmarcTimeGraph from '../DmarcTimeGraph'
import { formattedSummaryListData } from './fixtures/summaryListData'

describe('<DmarcReportTimeGraph />', () => {
  it('renders correctly', async () => {
    const { getByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <DmarcTimeGraph data={formattedSummaryListData} responsiveWidth={500}/>
        </I18nProvider>
      </ThemeProvider>,
    )
    await waitFor(() => getByText(/partialPass/i))
  })
})
