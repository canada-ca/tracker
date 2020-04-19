import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { DmarcReportPage } from '../DmarcReportPage'
import { QUERY_DMARC_REPORT } from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'

describe('<DmarcReportPage />', () => {
  const mocks = [
    {
      request: {
        query: QUERY_DMARC_REPORT,
        variables: { reportId: 'test-report-id' },
      },
      result: {
        data: {
          queryDmarcReport: {
            reportId: 'string',
            orgName: 'string',
            endDate: 'string',
            dmarcResult: false,
            dkimResult: false,
            spfResult: false,
            passDmarcPercentage: 10,
            passArcPercentage: 10,
            failDmarcPercentage: 30,
            failDkimPercentage: 20,
            failSpfPercentage: 20,
            count: 3,
            dkim: [
              {
                domain: 'string',
                selector: 'string',
                result: false,
                __typename: 'queryDkimResult',
              },
            ],
            spf: [
              {
                domain: 'string',
                scope: 'string',
                result: false,
                __typename: 'querySpfResult',
              },
            ],
            source: {
              ipAddress: '8.8.8.8',
              country: 'string',
              reverseDns: 'string',
              baseDomain: 'string',
              __typename: 'queryReportSource',
            },
            identifiers: {
              headerFrom: 'string',
              __typename: 'queryReportIdentifiers',
            },
            __typename: 'QueryDmarcReport',
          },
        },
      },
    },
  ]

  it('renders the test data', async () => {
    const { getByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks}>
                <DmarcReportPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    const ipAddress = await waitFor(() => getByText(/8.8.8.8/))

    await waitFor(() => {
      expect(ipAddress).toBeInTheDocument()
    })
  })
})
