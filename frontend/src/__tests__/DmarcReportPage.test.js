import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import DmarcReportPage from '../DmarcReportPage'
import {
  DEMO_DMARC_REPORT_DETAIL_TABLES,
  DEMO_DMARC_REPORT_SUMMARY_LIST,
} from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { rawSummaryListData } from '../fixtures/summaryListData'
import { rawDmarcReportDetailTablesData } from '../fixtures/dmarcReportDetailTablesData'

const mocks = [
  {
    request: {
      query: DEMO_DMARC_REPORT_SUMMARY_LIST,
      variables: { domainSlug: 'test-domain-slug' },
    },
    result: {
      data: {
        demoDmarcReportSummaryList: rawSummaryListData,
      },
    },
  },
  {
    request: {
      query: DEMO_DMARC_REPORT_DETAIL_TABLES,
      variables: {
        domainSlug: 'test-domain-slug',
        period: 'LAST30DAYS',
        year: '2020',
      },
    },
    result: {
      data: {
        demoDmarcReportDetailTables: rawDmarcReportDetailTablesData,
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
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <DmarcReportPage summaryListResponsiveWidth={500} />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/Partial Pass/i))
  })
})
