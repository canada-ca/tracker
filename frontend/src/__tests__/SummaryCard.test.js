import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import SummaryCard from '../SummaryCard'
import { formattedSummaryCardData } from '../fixtures/summaryCardData'

describe('<SummaryCard />', () => {
  it('renders correctly', async () => {
    const { getByText } = render(
      <I18nProvider i18n={setupI18n()}>
        <ThemeProvider theme={theme}>
          <SummaryCard
            title="title"
            description="description"
            data={formattedSummaryCardData}
          />
        </ThemeProvider>
      </I18nProvider>,
    )
    await waitFor(() => getByText(/Partial Pass/i))
  })
})
