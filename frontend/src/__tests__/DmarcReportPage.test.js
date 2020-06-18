import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { DmarcReportPage } from '../DmarcReportPage'
import {
  DEMO_DMARC_REPORT_DETAIL_TABLES,
  DEMO_DMARC_REPORT_SUMMARY,
  DEMO_DMARC_REPORT_SUMMARY_LIST,
} from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'

const mocks = [
  {
    request: {
      query: DEMO_DMARC_REPORT_SUMMARY,
      variables: {
        domainSlug: 'cyber.gc.ca',
        period: 'LAST30DAYS',
        year: 2020,
      },
    },
    result: {
      data: {
        dmarcReportSummary: {
          month: 'MAY',
          year: 2020,
          categoryTotals: {
            fullPass: 81205,
            partialPass: 62023,
            fail: 60283,
            total: 4774,
            __typename: 'CategoryTotals',
          },
          __typename: 'DmarcReportSummary',
        },
      },
    },
  },
  {
    request: {
      query: DEMO_DMARC_REPORT_SUMMARY_LIST,
      variables: { domainSlug: 'cyber.gc.ca' },
    },
    result: {
      data: {
        dmarcReportSummaryList: [
          {
            month: 'APRIL',
            year: 2020,
            categoryTotals: {
              fullPass: 36810,
              partialPass: 96623,
              fail: 3543,
              total: 30385,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'MARCH',
            year: 2020,
            categoryTotals: {
              fullPass: 82210,
              partialPass: 52306,
              fail: 10380,
              total: 23148,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'JULY',
            year: 2019,
            categoryTotals: {
              fullPass: 6847,
              partialPass: 44763,
              fail: 50497,
              total: 976,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'MARCH',
            year: 2020,
            categoryTotals: {
              fullPass: 16052,
              partialPass: 52429,
              fail: 78368,
              total: 16962,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'APRIL',
            year: 2020,
            categoryTotals: {
              fullPass: 48839,
              partialPass: 96398,
              fail: 67202,
              total: 13857,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'NOVEMBER',
            year: 2020,
            categoryTotals: {
              fullPass: 77136,
              partialPass: 72828,
              fail: 49600,
              total: 39148,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'LAST30DAYS',
            year: 2020,
            categoryTotals: {
              fullPass: 92539,
              partialPass: 34020,
              fail: 307,
              total: 8873,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'OCTOBER',
            year: 2020,
            categoryTotals: {
              fullPass: 55901,
              partialPass: 82435,
              fail: 11381,
              total: 42077,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'JULY',
            year: 2020,
            categoryTotals: {
              fullPass: 35750,
              partialPass: 40278,
              fail: 37209,
              total: 43395,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'AUGUST',
            year: 2019,
            categoryTotals: {
              fullPass: 69182,
              partialPass: 410,
              fail: 98757,
              total: 72845,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'JULY',
            year: 2019,
            categoryTotals: {
              fullPass: 60233,
              partialPass: 7918,
              fail: 29279,
              total: 39391,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'JULY',
            year: 2020,
            categoryTotals: {
              fullPass: 77927,
              partialPass: 32676,
              fail: 94178,
              total: 818,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
          {
            month: 'JUNE',
            year: 2020,
            categoryTotals: {
              fullPass: 41597,
              partialPass: 91429,
              fail: 87890,
              total: 62217,
              __typename: 'CategoryTotals',
            },
            __typename: 'DmarcReportSummaryList',
          },
        ],
      },
    },
  },
  {
    request: {
      query: DEMO_DMARC_REPORT_DETAIL_TABLES,
      variables: {
        domainSlug: 'cyber.gc.ca',
        period: 'LAST30DAYS',
        year: 2020,
      },
    },
    result: {
      data: {
        dmarcReportDetailTables: {
          month: 'MARCH',
          year: 2020,
          detailTables: {
            fullPass: [
              {
                sourceIpAddress: '248.185.184.23',
                envelopeFrom: 'nyah.name',
                totalMessages: 2455,
                countryCode: 'LA',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'shaina.org',
                dkimDomains: 'neva.info',
                dkimSelectors: 'selector1',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '113.184.228.151',
                envelopeFrom: 'pablo.name',
                totalMessages: 442,
                countryCode: 'NG',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'malika.name',
                dkimDomains: 'reyes.org',
                dkimSelectors: 'selector4',
                __typename: 'TableStructure',
              },
            ],
            spfFailure: [
              {
                sourceIpAddress: '166.178.127.94',
                envelopeFrom: 'godfrey.name',
                totalMessages: 1332,
                countryCode: 'MK',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'mikel.net',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '130.19.115.201',
                envelopeFrom: 'kolby.name',
                totalMessages: 2225,
                countryCode: 'AQ',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'daphne.com',
                __typename: 'TableStructure',
              },
            ],
            spfMisaligned: [
              {
                sourceIpAddress: '67.56.235.15',
                envelopeFrom: 'karolann.biz',
                totalMessages: 1369,
                countryCode: 'BY',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'deshawn.org',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '23.194.25.169',
                envelopeFrom: 'roselyn.biz',
                totalMessages: 970,
                countryCode: 'BW',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'jeramy.info',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '151.49.154.53',
                envelopeFrom: 'judy.biz',
                totalMessages: 2411,
                countryCode: 'AD',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'esteban.info',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '96.16.244.214',
                envelopeFrom: 'niko.com',
                totalMessages: 3956,
                countryCode: 'MK',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'rosamond.com',
                __typename: 'TableStructure',
              },
            ],
            dkimFailure: [
              {
                sourceIpAddress: '85.20.216.34',
                envelopeFrom: 'douglas.net',
                totalMessages: 1446,
                countryCode: 'GY',
                prefixOrg: 'string',
                dnsHost: 'string',
                dkimDomains: 'deshaun.net',
                dkimSelectors: 'none',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '215.202.26.226',
                envelopeFrom: 'libby.info',
                totalMessages: 902,
                countryCode: 'EE',
                prefixOrg: 'string',
                dnsHost: 'string',
                dkimDomains: 'karson.org',
                dkimSelectors: 'none',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '162.106.173.253',
                envelopeFrom: 'broderick.org',
                totalMessages: 1099,
                countryCode: 'NE',
                prefixOrg: 'string',
                dnsHost: 'string',
                dkimDomains: 'louie.biz',
                dkimSelectors: 'selector1',
                __typename: 'TableStructure',
              },
            ],
            dkimMisaligned: [
              {
                sourceIpAddress: '85.28.5.1',
                envelopeFrom: 'bell.name',
                totalMessages: 4612,
                countryCode: 'AG',
                prefixOrg: 'string',
                dnsHost: 'string',
                dkimDomains: 'bridie.name',
                dkimSelectors: 'selector1',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '161.0.189.132',
                envelopeFrom: 'nolan.biz',
                totalMessages: 1409,
                countryCode: 'FI',
                prefixOrg: 'string',
                dnsHost: 'string',
                dkimDomains: 'layne.net',
                dkimSelectors: 'selector1',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '129.156.67.0',
                envelopeFrom: 'gerard.net',
                totalMessages: 3033,
                countryCode: 'MD',
                prefixOrg: 'string',
                dnsHost: 'string',
                dkimDomains: 'sabryna.biz',
                dkimSelectors: 'selector1',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '36.169.238.159',
                envelopeFrom: 'dewayne.name',
                totalMessages: 3394,
                countryCode: 'BI',
                prefixOrg: 'string',
                dnsHost: 'string',
                dkimDomains: 'curt.info',
                dkimSelectors: 'selector4',
                __typename: 'TableStructure',
              },
            ],
            dmarcFailure: [
              {
                sourceIpAddress: '146.98.149.191',
                envelopeFrom: 'norene.biz',
                totalMessages: 3413,
                countryCode: 'AT',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'jennings.info',
                dkimDomains: 'sam.com',
                dkimSelectors: 'selector1',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '51.175.45.9',
                envelopeFrom: 'lilian.com',
                totalMessages: 3866,
                countryCode: 'HT',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'kendall.net',
                dkimDomains: 'mekhi.net',
                dkimSelectors: 'selector1',
                __typename: 'TableStructure',
              },
              {
                sourceIpAddress: '106.137.141.223',
                envelopeFrom: 'may.org',
                totalMessages: 296,
                countryCode: 'CG',
                prefixOrg: 'string',
                dnsHost: 'string',
                spfDomains: 'fredy.net',
                dkimDomains: 'phoebe.org',
                dkimSelectors: 'selector1',
                __typename: 'TableStructure',
              },
            ],
            __typename: 'DetailTables',
          },
          __typename: 'DmarcReportDetailTables',
        },
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
    const { getByText, getAllByText } = render(
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
    await waitFor(() => getByText(/All data represented/i))
    await waitFor(() => getByText(/Partial Pass/i))
    await waitFor(() => getByText(/partialPass/i))
    await waitFor(() => getAllByText(/Fully Aligned by IP Address/i))
    await waitFor(() => getAllByText(/SPF Failures by IP Address/i))
    await waitFor(() => getAllByText(/SPF Misalignment by IP Address/i))
    await waitFor(() => getAllByText(/DKIM Failures by IP Address/i))
    await waitFor(() => getAllByText(/DKIM Misalignment by IP Address/i))
    await waitFor(() => getAllByText(/DKIM Failures by IP Address/i))
  })
})
