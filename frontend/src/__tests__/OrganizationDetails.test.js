import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter, Route } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { UserStateProvider } from '../UserState'
import {
  ORG_DETAILS_PAGE,
  PAGINATED_DOMAINS,
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
                summaries: {
                  mail: {
                    total: 86954,
                    categories: [
                      {
                        name: 'pass',
                        count: 7435,
                        percentage: 50,
                      },
                      {
                        name: 'fail',
                        count: 7435,
                        percentage: 43.5,
                      },
                    ],
                  },
                  web: {
                    total: 54386,
                    categories: [
                      {
                        name: 'pass',
                        count: 7435,
                        percentage: 50,
                      },
                      {
                        name: 'fail',
                        count: 7435,
                        percentage: 43.5,
                      },
                    ],
                  },
                },

                affiliations: {
                  totalCount: 5,
                  edges: [
                    {
                      node: {
                        id: 'ABCDEF38924712398',
                      },
                    },
                  ],
                },
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
                tfaSendMethod: null,
              }}
            >
              <MockedProvider mocks={mocks} addTypename={false}>
                <MemoryRouter
                  initialEntries={['/organizations/tbs-sct-gc-ca']}
                  initialIndex={0}
                >
                  <Route path="/organizations/:orgSlug">
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
