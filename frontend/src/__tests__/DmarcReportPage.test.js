import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { MemoryRouter, Route } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import DmarcReportPage from '../DmarcReportPage'
import {
  DMARC_REPORT_GRAPH,
  PAGINATED_DKIM_FAILURE_REPORT as DKIM_FAILURE_FORWARD,
  PAGINATED_DMARC_FAILURE_REPORT as DMARC_FAILURE_FORWARD,
  PAGINATED_FULL_PASS_REPORT as FULL_PASS_FORWARD,
  PAGINATED_SPF_FAILURE_REPORT as SPF_FAILURE_FORWARD,
} from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { rawDmarcReportGraphData } from '../fixtures/dmarcReportGraphData'
import { rawDkimFailureData } from '../fixtures/dkimFailureData'
import { rawDmarcFailureData } from '../fixtures/dmarcFailureData'
import { rawSpfFailureData } from '../fixtures/spfFailureData'
import { rawFullPassData } from '../fixtures/fullPassData'
import { createCache } from '../client'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

const mocks = [
  {
    request: {
      query: DMARC_REPORT_GRAPH,
      variables: {
        domain: 'test-domain',
      },
    },
    result: rawDmarcReportGraphData,
  },
  {
    request: {
      query: DKIM_FAILURE_FORWARD,
      variables: {
        domain: 'test-domain',
        month: 'LAST30DAYS',
        year: '2020',
        first: 50,
        after: '',
      },
    },
    result: rawDkimFailureData,
  },
  {
    request: {
      query: DMARC_FAILURE_FORWARD,
      variables: {
        month: 'LAST30DAYS',
        year: '2020',
        domain: 'test-domain',
        first: 50,
        after: '',
      },
    },
    result: rawDmarcFailureData,
  },
  {
    request: {
      query: SPF_FAILURE_FORWARD,
      variables: {
        domain: 'test-domain',
        month: 'LAST30DAYS',
        year: '2020',
        first: 50,
        after: '',
      },
    },
    result: rawSpfFailureData,
  },
  {
    request: {
      query: FULL_PASS_FORWARD,
      variables: {
        domain: 'test-domain',
        month: 'LAST30DAYS',
        year: '2020',
        first: 50,
        after: '',
      },
    },
    result: rawFullPassData,
  },
]

describe('<DmarcReportPage />', () => {
  it('renders header', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter
              initialEntries={[
                '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
              ]}
              initialIndex={0}
            >
              <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                <DmarcReportPage summaryListResponsiveWidth={500} />
              </Route>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </MockedProvider>,
    )
    await waitFor(() => getAllByText(/test-domain/i))
  })

  it('renders date selector', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter
              initialEntries={[
                '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
              ]}
              initialIndex={0}
            >
              <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                <DmarcReportPage summaryListResponsiveWidth={500} />
              </Route>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </MockedProvider>,
    )
    await waitFor(() => getAllByText(/Showing data for period:/i))
  })

  it('renders bar graph', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter
              initialEntries={[
                '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
              ]}
              initialIndex={0}
            >
              <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                <DmarcReportPage summaryListResponsiveWidth={500} />
              </Route>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </MockedProvider>,
    )
    await waitFor(() => getAllByText(/^Fail DKIM$/i))
  })

  it('renders tables', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter
              initialEntries={[
                '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
              ]}
              initialIndex={0}
            >
              <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                <DmarcReportPage summaryListResponsiveWidth={500} />
              </Route>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </MockedProvider>,
    )
    await waitFor(() => getAllByText(/DKIM Failures by IP Address/i))
    await waitFor(() => getAllByText(/SPF Failures by IP Address/i))
    await waitFor(() => getAllByText(/Fully Aligned by IP Address/i))
    await waitFor(() => getAllByText(/DMARC Failures by IP Address/i))
  })
})
