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
  it('renders pass icons in sub-headers correctly', async () => {
    const mocks = [
      {
        request: {
          query: QUERY_DMARC_REPORT,
          variables: {
            reportId: 'test-report-id',
          },
        },
        result: {
          data: {
            queryDmarcReport: {
              reportId: 'string',
              orgName: 'string',
              endDate: 'string',
              dmarcResult: true,
              dkimResult: true,
              spfResult: true,
              passPercentage: 70,
              count: 2,
              dkim: [
                {
                  domain: 'string',
                  selector: 'string',
                  result: false,
                },
              ],
              spf: [
                {
                  domain: 'string',
                  scope: 'string',
                  result: false,
                },
              ],
              source: {
                ipAddress: 'string',
                country: 'string',
                reverseDns: 'string',
                baseDomain: 'string',
              },
              identifiers: {
                headerFrom: 'string',
              },
            },
          },
        },
      },
    ]

    const { getByRole } = render(
      <UserStateProvider
        initialState={{
          userName: 'foo@example.com',
          jwt: 'somestring',
          tfa: null,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <DmarcReportPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    const dmarcHeader = await waitFor(() => getByRole('dmarcHeader'))
    const dkimHeader = await waitFor(() => getByRole('dkimHeader'))
    const spfHeader = await waitFor(() => getByRole('spfHeader'))

    await waitFor(() => {
      expect(dmarcHeader.children[1]).toHaveAttribute('role', 'passIcon')
      expect(dkimHeader.children[1]).toHaveAttribute('role', 'passIcon')
      expect(spfHeader.children[1]).toHaveAttribute('role', 'passIcon')
    })
  })

  it('renders fail icons in sub-headers correctly', async () => {
    const mocks = [
      {
        request: {
          query: QUERY_DMARC_REPORT,
          variables: {
            reportId: 'test-report-id',
          },
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
              passPercentage: 70,
              count: 2,
              dkim: [
                {
                  domain: 'string',
                  selector: 'string',
                  result: false,
                },
              ],
              spf: [
                {
                  domain: 'string',
                  scope: 'string',
                  result: false,
                },
              ],
              source: {
                ipAddress: 'string',
                country: 'string',
                reverseDns: 'string',
                baseDomain: 'string',
              },
              identifiers: {
                headerFrom: 'string',
              },
            },
          },
        },
      },
    ]

    const { getByText, getByRole } = render(
      <UserStateProvider
        initialState={{
          userName: 'foo@example.com',
          jwt: 'somestring',
          tfa: null,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={setupI18n()}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <MockedProvider mocks={mocks} addTypename={false}>
                <DmarcReportPage />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() => getByText(/DMARC Report/i))

    const dmarcHeader = getByRole('dmarcHeader')
    const dkimHeader = getByRole('dkimHeader')
    const spfHeader = getByRole('spfHeader')

    expect(dmarcHeader).toBeTruthy()
    expect(dkimHeader).toBeTruthy()
    expect(spfHeader).toBeTruthy()

    expect(dmarcHeader.children[1]).toHaveAttribute('role', 'failIcon')
    expect(dkimHeader.children[1]).toHaveAttribute('role', 'failIcon')
    expect(spfHeader.children[1]).toHaveAttribute('role', 'failIcon')
  })
})
