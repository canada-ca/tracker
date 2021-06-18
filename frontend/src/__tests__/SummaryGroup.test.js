import React from 'react'
import { MockedProvider } from '@apollo/client/testing'
import { render, waitFor } from '@testing-library/react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { SummaryGroup } from '../SummaryGroup'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const data = {
  webSummary: {
    categories: [
      {
        name: 'pass',
        count: 7468,
        percentage: 56.6,
      },
      {
        name: 'fail',
        count: 5738,
        percentage: 43.4,
      },
    ],
    total: 13206,
  },
  mailSummary: {
    categories: [
      {
        name: 'pass',
        count: 2091,
        percentage: 11.2,
      },
      {
        name: 'fail',
        count: 8604,
        percentage: 46.2,
      },
    ],
    total: 18613,
  },
}

describe('<SummaryGroup />', () => {
  describe('given the data for web and email summaries', () => {
    it('displays two summary cards', async () => {
      const { getAllByText } = render(
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <MockedProvider>
              <SummaryGroup web={data.webSummary} mail={data.mailSummary} />
            </MockedProvider>
          </ThemeProvider>
        </I18nProvider>,
      )
      const summaries = await waitFor(() => getAllByText(/settings summary/i))
      expect(summaries).toHaveLength(2)
    })
  })
})
