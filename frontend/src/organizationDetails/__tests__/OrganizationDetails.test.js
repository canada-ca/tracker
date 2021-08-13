import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter, Route } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import matchMediaPolyfill from 'mq-polyfill'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import OrganizationDetails from '../OrganizationDetails'

import { UserVarProvider } from '../../utilities/userState'
import { ORG_DETAILS_PAGE, IS_USER_ADMIN } from '../../graphql/queries'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
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
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <MemoryRouter
                  initialEntries={['/organizations/tbs-sct-gc-ca']}
                  initialIndex={0}
                >
                  <Route path="/organizations/:orgSlug">
                    <OrganizationDetails />
                  </Route>
                </MemoryRouter>
              </UserVarProvider>
            </MockedProvider>
          </I18nProvider>
        </ChakraProvider>,
      )

      await waitFor(() => {
        expect(getByText(name)).toBeInTheDocument()
        expect(getByText('Users')).toBeInTheDocument()
      })
    })
  })
})

describe('<OrganizationDetails />', () => {
  describe('for a non-admin user', () => {
    it('displays details using the treasury-board-of-canada-secretariat slug', async () => {
      window.resizeTo(1024, 768)

      const mocks = [
        {
          request: {
            query: ORG_DETAILS_PAGE,
            variables: { slug: 'treasury-board-of-canada-secretariat' },
          },
          result: {
            errors: [
              {
                message:
                  'cannot query affiliations on organization without admin permission or higher.',
                locations: [{ line: 33, column: 5 }],
                path: ['organization', 'affiliations'],
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
              },
            ],
            data: {
              organization: {
                id: 'b3JnYW5pemF0aW9uczoyMTY2MDUy',
                name: 'Treasury Board of Canada Secretariat',
                acronym: 'TBS',
                domainCount: 82,
                city: 'Ottawa',
                province: 'Ontario',
                verified: true,
                summaries: {
                  mail: {
                    total: 82,
                    categories: [
                      {
                        name: 'pass',
                        count: 0,
                        percentage: 0,
                        __typename: 'SummaryCategory',
                      },
                      {
                        name: 'fail',
                        count: 82,
                        percentage: 100,
                        __typename: 'SummaryCategory',
                      },
                    ],
                    __typename: 'CategorizedSummary',
                  },
                  web: {
                    total: 82,
                    categories: [
                      {
                        name: 'pass',
                        count: 5,
                        percentage: 6.1,
                        __typename: 'SummaryCategory',
                      },
                      {
                        name: 'fail',
                        count: 77,
                        percentage: 93.9,
                        __typename: 'SummaryCategory',
                      },
                    ],
                    __typename: 'CategorizedSummary',
                  },
                  __typename: 'OrganizationSummary',
                },
                affiliations: null,
                __typename: 'Organization',
              },
            },
          },
        },
      ]

      const { getByText } = render(
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: 'asdf1234',
                  tlfaSendMethod: null,
                  userName: 'justauser',
                })}
              >
                <MemoryRouter
                  initialEntries={[
                    '/organizations/treasury-board-of-canada-secretariat',
                  ]}
                  initialIndex={0}
                >
                  <Route path="/organizations/:orgSlug">
                    <OrganizationDetails />
                  </Route>
                </MemoryRouter>
              </UserVarProvider>
            </MockedProvider>
          </I18nProvider>
        </ChakraProvider>,
      )

      await waitFor(() => {
        expect(getByText(/Ottawa/)).toBeTruthy()
      })
    })
  })
})
