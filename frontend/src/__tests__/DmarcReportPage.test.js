import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter, Route } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import DmarcReportPage from '../DmarcReportPage'
import { DMARC_REPORT_PAGE } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { rawDmarcReportSummaryData } from '../fixtures/dmarcReportSummaryData'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const mocks = [
  {
    request: {
      query: DMARC_REPORT_PAGE,
      variables: {
        domain: 'test-domain',
        month: 'LAST30DAYS',
        year: '2020',
      },
    },
    result: rawDmarcReportSummaryData,
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
  it('renders header', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter
              initialEntries={[
                '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
              ]}
              initialIndex={0}
            >
              <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                <MockedProvider mocks={mocks} addTypename={false}>
                  <DmarcReportPage summaryListResponsiveWidth={500} />
                </MockedProvider>
              </Route>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/test-domain/i))
  })

  it('renders date selector', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter
              initialEntries={[
                '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
              ]}
              initialIndex={0}
            >
              <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                <MockedProvider mocks={mocks} addTypename={false}>
                  <DmarcReportPage summaryListResponsiveWidth={500} />
                </MockedProvider>
              </Route>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/Showing data for period:/i))
  })

  it('renders bar graph', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter
              initialEntries={[
                '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
              ]}
              initialIndex={0}
            >
              <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                <MockedProvider mocks={mocks} addTypename={false}>
                  <DmarcReportPage summaryListResponsiveWidth={500} />
                </MockedProvider>
              </Route>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/^Pass Only SPF$/i))
  })

  it('renders tables', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter
              initialEntries={[
                '/domains/test-domain/dmarc-report/LAST30DAYS/2020',
              ]}
              initialIndex={0}
            >
              <Route path="/domains/:domainSlug/dmarc-report/:period?/:year?">
                <MockedProvider mocks={mocks} addTypename={false}>
                  <DmarcReportPage summaryListResponsiveWidth={500} />
                </MockedProvider>
              </Route>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/^Fully Aligned by IP Address$/i))
  })
})
