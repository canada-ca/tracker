import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter, Route } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import DmarcReportPage from '../DmarcReportPage'
import {
  DMARC_REPORT_DETAIL_TABLES,
  DMARC_REPORT_SUMMARY,
  DMARC_REPORT_SUMMARY_LIST,
} from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { rawSummaryListData } from '../fixtures/summaryListData'
import { rawDmarcReportDetailTablesData } from '../fixtures/dmarcReportDetailTablesData'
import { rawSummaryCardData } from '../fixtures/summaryCardData'

const mocks = [
  {
    request: {
      query: DMARC_REPORT_SUMMARY,
      variables: {
        domainSlug: 'test-domain-slug',
        period: 'LAST30DAYS',
        year: '2020',
      },
    },
    result: {
      data: rawSummaryCardData,
    },
  },
  {
    request: {
      query: DMARC_REPORT_SUMMARY_LIST,
      variables: { domainSlug: 'test-domain-slug' },
    },
    result: {
      data: rawSummaryListData,
    },
  },
  {
    request: {
      query: DMARC_REPORT_DETAIL_TABLES,
      variables: {
        domainSlug: 'test-domain-slug',
        period: 'LAST30DAYS',
        year: '2020',
      },
    },
    result: {
      data: {
        dmarcReportDetailTables: rawDmarcReportDetailTablesData,
      },
    },
  },
]

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<DmarcReportPage />', () => {
  it('renders', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter
              initialEntries={['/domains/test-domain-slug/dmarc-report']}
              initialIndex={0}
            >
              <Route path="/domains/:domainSlug/dmarc-report">
                <MockedProvider mocks={mocks} addTypename={false}>
                  <DmarcReportPage summaryListResponsiveWidth={500} />
                </MockedProvider>
              </Route>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/test-domain-slug/i))
  })
})
