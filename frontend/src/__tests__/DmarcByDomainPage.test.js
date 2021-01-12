import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { PAGINATED_DMARC_REPORT_SUMMARY_TABLE as FORWARD } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import DmarcByDomainPage from '../DmarcByDomainPage'
import { rawDmarcReportSummaryTableData } from '../fixtures/dmarcReportSummaryTable'

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

describe('<DmarcByDomainPage />', () => {
  it('renders page header', async () => {
    const mocks = [
      {
        request: {
          query: FORWARD,
          variables: {
            month: 'LAST30DAYS',
            year: '2021',
            first: 10,
          },
        },
        result: rawDmarcReportSummaryTableData,
      },
    ]
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <DmarcByDomainPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/^DMARC Messages$/i))
  })

  it('renders date selector', async () => {
    const mocks = [
      {
        request: {
          query: FORWARD,
          variables: { first: 10, month: 'LAST30DAYS', year: '2021' },
        },
        result: rawDmarcReportSummaryTableData,
      },
    ]
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <DmarcByDomainPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/Showing data for period:/i))
  })

  it('renders summary table', async () => {
    const mocks = [
      {
        request: {
          query: FORWARD,
          variables: {
            month: 'LAST30DAYS',
            year: '2021',
            first: 10,
          },
        },
        result: rawDmarcReportSummaryTableData,
      },
    ]
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <DmarcByDomainPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/Total Messages/i))
  })
})
