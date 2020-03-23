import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import {
  render,
  cleanup,
  waitForElement,
  getByText,
} from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { DmarcReportPage } from '../DmarcReportPage'
import gql from 'graphql-tag'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<DmarcReportPage />', () => {
  afterEach(cleanup)

  it('successfully renders the component on its own', () => {
    render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <DmarcReportPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(render).toBeTruthy()
  })

  it('renders pass icons in headers correctly', async () => {
    const mocks = [
      {
        request: {
          query: gql`
            {
              dmarcReport {
                reportId
                orgName
                endDate
                dmarcResult
                dkimResult
                spfResult
                passPercentage
                count
                dkim {
                  domain
                  selector
                  result
                }
                spf {
                  domain
                  scope
                  result
                }
                source {
                  ipAddress
                  country
                  reverseDns
                  baseDomain
                }
                identifiers {
                  headerFrom
                }
              }
            }
          `,
        },
        result: {
          data: {
            dmarcReport: {
              reportId: 'string',
              orgName: 'Margot',
              endDate: '<DateTime>',
              dmarcResult: 'pass',
              dkimResult: 'pass',
              spfResult: 'pass',
              passPercentage: 95,
              count: 47832,
              dkim: [
                {
                  domain: 'geovanni.name',
                  selector: 'test-selector',
                  result: 'pass',
                  __typename: 'DkimResult',
                },
              ],
              spf: [
                {
                  domain: 'deonte.org',
                  scope: 'test-scope',
                  result: 'pass',
                  __typename: 'SpfResult',
                },
              ],
              source: {
                ipAddress: '127.0.0.1',
                country: 'Canada',
                reverseDns: 'string',
                baseDomain: 'werner.biz',
                __typename: 'Source',
              },
              identifiers: {
                headerFrom: 'dortha.biz',
                __typename: 'Identifiers',
              },
              __typename: 'DmarcReport',
            },
          },
        },
      },
    ]

    const { container, getByRole } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider mocks={mocks}>
              <DmarcReportPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(render).toBeTruthy()
    expect(container).toBeTruthy()

    await waitForElement(() => getByText(container, /DMARC Report/i), {
      container,
    })

    const dmarcHeader = getByRole('dmarcHeader')
    const dkimHeader = getByRole('dkimHeader')
    const spfHeader = getByRole('spfHeader')

    expect(dmarcHeader).toBeTruthy()
    expect(dkimHeader).toBeTruthy()
    expect(spfHeader).toBeTruthy()

    expect(dmarcHeader.children[1]).toHaveAttribute('role', 'passIcon')
    expect(dkimHeader.children[1]).toHaveAttribute('role', 'passIcon')
    expect(spfHeader.children[1]).toHaveAttribute('role', 'passIcon')


  })
})
