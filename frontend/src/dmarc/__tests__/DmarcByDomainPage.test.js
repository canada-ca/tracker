import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import { matchMediaSize } from '../../helpers/matchMedia'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

import DmarcByDomainPage from '../DmarcByDomainPage'

import { UserVarProvider } from '../../utilities/userState'
import { rawDmarcReportSummaryTableData } from '../../fixtures/dmarcReportSummaryTable'
import { PAGINATED_DMARC_REPORT_SUMMARY_TABLE as FORWARD } from '../../graphql/queries'
import { TourProvider } from '../../userOnboarding/contexts/TourContext'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

matchMediaSize()

describe('<DmarcByDomainPage />', () => {
  const currentYear = new Date().getFullYear()
  const getDynamicYear = () => {
    const currentMonth = new Date().getMonth()
    if (currentMonth >= 8) {
      return String(currentYear)
    } else {
      return String(currentYear - 1)
    }
  }

  const mocks = [
    {
      request: {
        query: FORWARD,
        variables: {
          first: 10,
          month: 'LAST30DAYS',
          year: currentYear.toString(),
          orderBy: {
            field: 'TOTAL_MESSAGES',
            direction: 'DESC',
          },
          search: '',
          isAffiliated: true,
        },
      },
      result: { data: rawDmarcReportSummaryTableData },
    },
    {
      request: {
        query: FORWARD,
        variables: {
          first: 10,
          month: 'AUGUST',
          year: getDynamicYear(),
          orderBy: {
            field: 'TOTAL_MESSAGES',
            direction: 'DESC',
          },
          search: '',
          isAffiliated: true,
        },
      },
      result: {
        data: {
          findMyDmarcSummaries: {
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: true,
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              endCursor: 'YXJyYXljb25uZWN0aW9uOjk=',
              __typename: 'PageInfo',
            },
            edges: [
              {
                node: {
                  id: 'a26b94b0-a290-4912-a4ea-7563b07430f6',
                  month: 'AUGUST',
                  year: 2019,
                  domain: {
                    domain: 'another.domain',
                    __typename: 'Domain',
                  },
                  categoryPercentages: {
                    failPercentage: 7,
                    fullPassPercentage: 76,
                    passDkimOnlyPercentage: 14,
                    passSpfOnlyPercentage: 3,
                    totalMessages: 9501,
                    __typename: 'CategoryPercentages',
                  },
                  __typename: 'DmarcSummary',
                },
                __typename: 'DmarcSummaryEdge',
              },
            ],
            __typename: 'DmarcSummaryConnection',
          },
        },
      },
    },
  ]

  it('renders page header', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({ jwt: 'somejwt', tfaSendMethod: null, userName: null, affiliations: { totalCount: 1 } })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <TourProvider>
                  <DmarcByDomainPage />
                </TourProvider>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => getAllByText(/^DMARC Summaries$/i))
  })

  it('renders date selector', async () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({ jwt: 'somejwt', tfaSendMethod: null, userName: null, affiliations: { totalCount: 1 } })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <TourProvider>
                  <DmarcByDomainPage />
                </TourProvider>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => getByText(/Showing data for period:/i))
  })
  it('renders table with data', async () => {
    const { findByRole, findByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({ jwt: 'somejwt', tfaSendMethod: null, userName: null, affiliations: { totalCount: 1 } })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <TourProvider>
                  <DmarcByDomainPage />
                </TourProvider>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await findByRole('table')
    await findByText(/erna.org/)
  })
  it('can change period', async () => {
    const { findByRole, findByText, getByRole } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({ jwt: 'somejwt', tfaSendMethod: null, userName: null, affiliations: { totalCount: 1 } })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <TourProvider>
                  <DmarcByDomainPage />
                </TourProvider>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await findByRole('table')
    await findByText(/erna.org/)

    const periodSelector = getByRole('combobox', {
      name: /showing data for period:/i,
    })

    userEvent.selectOptions(periodSelector, `AUGUST, ${getDynamicYear()}`)

    await findByText(/another.domain/)
  })
})
