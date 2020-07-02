import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import SummaryCard from '../SummaryCard'

const { data } = {
  data: {
    webSummary: {
      categories: [
        {
          name: 'moderate',
          count: 33,
          percentage: 33,
        },
        {
          name: 'strong',
          count: 33,
          percentage: 33,
        },
        {
          name: 'weak',
          count: 33,
          percentage: 33,
        },
      ],
      total: 100,
    },
  },
}

describe('<SummaryCard />', () => {
  it('renders three bars with the numbers from the test data', async () => {
    const { getAllByText } = render(
      <I18nProvider i18n={setupI18n()}>
        <ThemeProvider theme={theme}>
          <SummaryCard
            title="title"
            categoryDisplay={{
              strong: { name: 'awesome', color: '#30362F' },
              moderate: { name: 'meh', color: '#8B94A3' },
              weak: { name: 'nah', color: '#0a8754' },
            }}
            description="description"
            data={data.webSummary}
          />
        </ThemeProvider>
      </I18nProvider>,
    )
    const bars = await waitFor(() => getAllByText(/33 - 33%/i))

    expect(bars).toHaveLength(3)
  })
})
