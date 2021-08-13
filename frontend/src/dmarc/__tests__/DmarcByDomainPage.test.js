import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import DmarcByDomainPage from '../DmarcByDomainPage'

import { UserVarProvider } from '../../utilities/userState'
import { rawDmarcReportSummaryTableData } from '../../fixtures/dmarcReportSummaryTable'
import { PAGINATED_DMARC_REPORT_SUMMARY_TABLE as FORWARD } from '../../graphql/queries'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
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
  const mocks = [
    {
      request: {
        query: FORWARD,
        variables: {
          first: 10,
          month: 'LAST30DAYS',
          year: '2021',
          search: '',
          orderBy: {
            field: 'TOTAL_MESSAGES',
            direction: 'DESC',
          },
        },
      },
      result: rawDmarcReportSummaryTableData,
    },
  ]

  it('renders page header', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <DmarcByDomainPage />
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
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <DmarcByDomainPage />
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => getByText(/Showing data for period:/i))
  })
})
