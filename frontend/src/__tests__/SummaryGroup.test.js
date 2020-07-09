import React from 'react'
import { MockedProvider } from '@apollo/react-testing'
import { render, waitFor } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { SummaryGroup } from '../SummaryGroup'
import { WEB_AND_EMAIL_SUMMARIES } from '../graphql/queries'

const mocks = [
  {
    request: {
      query: WEB_AND_EMAIL_SUMMARIES,
    },
    result: {
      data: {
        webSummary: {
          categories: [
            {
              name: 'full-pass',
              count: 7468,
              percentage: 56.6,
            },
            {
              name: 'full-fail',
              count: 5738,
              percentage: 43.4,
            },
          ],
          total: 13206,
        },
        emailSummary: {
          categories: [
            {
              name: 'full-pass',
              count: 2091,
              percentage: 11.2,
            },
            {
              name: 'full-fail',
              count: 8604,
              percentage: 46.2,
            },
            {
              name: 'partial-pass',
              count: 7918,
              percentage: 42.5,
            },
          ],
          total: 18613,
        },
      },
    },
  },
]

describe('<SummaryGroup />', () => {
  describe('given the data for web and email summaries', () => {
    it('displays two summay cards', async () => {
      const { getAllByText } = render(
        <I18nProvider i18n={setupI18n()}>
          <ThemeProvider theme={theme}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <SummaryGroup title="title" description="description" />
            </MockedProvider>
          </ThemeProvider>
        </I18nProvider>,
      )
      const summaries = await waitFor(() => getAllByText(/Summary/i))
      expect(summaries).toHaveLength(2)
    })
  })
})
