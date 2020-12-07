import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter, Route } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { UserStateProvider } from '../UserState'
import {
  ORG_DETAILS_PAGE,
  PAGINATED_DOMAINS,
  REVERSE_PAGINATED_DOMAINS,
  WEB_AND_EMAIL_SUMMARIES,
} from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import OrganizationDetails from '../OrganizationDetails'
import matchMediaPolyfill from 'mq-polyfill'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

matchMediaPolyfill(window)

window
  .matchMedia('(min-width: 920px)') // Create MediaQueryList instance
  .addListener(console.log) // Subscribe to MQ mode changes

/**
 * For dispatching resize event
 * we must implement window.resizeTo in jsdom
 */
window.resizeTo = function resizeTo(width, height) {
  Object.assign(this, {
    innerWidth: width,
    innerHeight: height,
    outerWidth: width,
    outerHeight: height,
  }).dispatchEvent(new this.Event('resize'))
}

describe('<OrganizationDetails />', () => {
  describe('given the url /organisations/tbs-sct-gc-ca', () => {
    it('displays details using the tbs-sct-gc-ca slug', async () => {
      window.resizeTo(1024, 768)

      const name = 'Treasury Board Secretariat'

      const mocks = [
        {
          request: {
            query: ORG_DETAILS_PAGE,
            variables: { slug: 'tbs-sct-gc-ca' },
          },
          result: {
            data: {
              organization: {
                id: 'ODk3MDg5MzI2MA==',
                name,
                acronym: 'TBS',
                domainCount: 1,
                city: 'Ottawa',
                province: 'ON',
                verified: true,
                domains: {
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                  },
                  edges: [
                    {
                      node: {
                        id: 'OTY2NTI4OTY4NA==',
                        domain: 'tbs-sct.gc.ca',
                        lastRan: '2020-06-18T00:42:12.414Z',
                        email: {
                          dmarc: {
                            edges: [
                              {
                                node: {
                                  timestamp: '2020-02-10T22:00:27.555Z',
                                  dmarcPhase: 2,
                                  pPolicy: 'missing',
                                  spPolicy: 'missing',
                                  pct: 60,
                                },
                              },
                            ],
                          },
                        },
                        web: {
                          https: {
                            edges: [
                              {
                                node: {
                                  timestamp: '2019-12-22T09:18:56.523Z',
                                  implementation: 'Bad Hostname',
                                  enforced: 'Strict',
                                  hsts: 'HSTS Fully Implemented',
                                  hstsAge: '21672901',
                                  preloaded: 'HSTS Preloaded',
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
                affiliations: {
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                  },
                  totalCount: 5,
                  edges: {
                    node: {
                      permission: 'ADMIN',
                      user: {
                        id: 'VXNlckxpc3RJdGVtOig0LCAzKQ==',
                        userName: 'testuser@testemail.gc.ca',
                        displayName: 'testuser',
                        tfaValidated: false,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          request: {
            query: WEB_AND_EMAIL_SUMMARIES,
          },
          result: {
            data: {
              webSummary: {
                categories: [
                  {
                    name: 'full-pass',
                    count: 7468,
                    percentage: 56.6,
                  },
                  {
                    name: 'full-fail',
                    count: 5738,
                    percentage: 43.4,
                  },
                ],
                total: 13206,
              },
              emailSummary: {
                categories: [
                  {
                    name: 'full-pass',
                    count: 2091,
                    percentage: 11.2,
                  },
                  {
                    name: 'full-fail',
                    count: 8604,
                    percentage: 46.2,
                  },
                  {
                    name: 'partial-pass',
                    count: 7918,
                    percentage: 42.5,
                  },
                ],
                total: 18613,
              },
            },
          },
        },
      ]

      const { getByText } = render(
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <UserStateProvider
              initialState={{
                userName: 'user@example.com',
                jwt: 'somestring',
                tfa: null,
              }}
            >
              <MockedProvider mocks={mocks} addTypename={false}>
                <MemoryRouter
                  initialEntries={['/organization/tbs-sct-gc-ca']}
                  initialIndex={0}
                >
                  <Route path="/organization/:orgSlug">
                    <OrganizationDetails />
                  </Route>
                </MemoryRouter>
              </MockedProvider>
            </UserStateProvider>
          </I18nProvider>
        </ThemeProvider>,
      )

      await waitFor(() => {
        expect(getByText(name)).toBeInTheDocument()
      })
    })
  })
})
