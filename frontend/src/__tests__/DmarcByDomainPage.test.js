import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import {
  DMARC_REPORT_SUMMARY_TABLE,
} from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { rawDmarcReportDetailTablesData } from '../fixtures/dmarcReportDetailTablesData'
import DmarcByDomainPage from '../DmarcByDomainPage'

const mocks = [
  {
    request: {
      query: DMARC_REPORT_SUMMARY_TABLE,
      variables: {
        period: 'LAST30DAYS',
        year: '2020',
      },
    },
    result: {
      data: rawDmarcReportDetailTablesData,
    },
  },
]

const currentDate = new Date()
console.log(currentDate.getFullYear().toString())

describe('<DmarcByDomainPage />', () => {
  it('renders', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{ userName: null, jwt: null, tfa: null }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <DmarcByDomainPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )
    await waitFor(() => getAllByText(/DMARC Messages/i))
  })
})
