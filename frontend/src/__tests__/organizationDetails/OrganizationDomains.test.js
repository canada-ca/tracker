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

import { OrganizationDomains } from '../../organizationDetails/OrganizationDomains'
import { UserVarProvider } from '../../utilities/userState'
import { PAGINATED_ORG_DOMAINS } from '../../graphql/queries'

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

describe('<OrganizationDomains />', () => {
  describe('given the url /organisations/tbs-sct-gc-ca', () => {
    it('displays domains using the tbs-sct-gc-ca slug', async () => {
      window.resizeTo(1024, 768)

      const orgSlug = 'tbs-sct-gc-ca'

      const mocks = [
        {
          request: {
            query: PAGINATED_ORG_DOMAINS,
            variables: { slug: 'tbs-sct-gc-ca', first: 10 },
          },
          result: {
            data: {
              findOrganizationBySlug: {
                id: 'testid',
                domains: {
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: 'string',
                    hasPreviousPage: true,
                    startCursor: 'string',
                  },
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        id: 'OTUyNTQ3Mjg0Nw==',
                        domain: 'dfo-mpo.gc.ca',
                        lastRan: '1612768306050',
                        status: {
                          dkim: 'FAIL',
                          dmarc: 'FAIL',
                          https: 'INFO',
                          spf: 'FAIL',
                          ssl: 'PASS',
                        },
                        hasDMARCReport: true,
                      },
                    },
                    {
                      cursor: 'string',
                      node: {
                        id: 'ODEzNzA4ODA3OA==',
                        domain: 'dfait-maeci.gc.ca',
                        lastRan: '1612792126546',
                        status: {
                          dkim: 'PASS',
                          dmarc: 'PASS',
                          https: 'INFO',
                          spf: 'FAIL',
                          ssl: 'INFO',
                        },
                        hasDMARCReport: true,
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
                  initialEntries={['/organization/tbs-sct-gc-ca']}
                  initialIndex={0}
                >
                  <Route path="/organization/:orgSlug">
                    <OrganizationDomains orgSlug={orgSlug} />
                  </Route>
                </MemoryRouter>
              </UserVarProvider>
            </MockedProvider>
          </I18nProvider>
        </ChakraProvider>,
      )

      await waitFor(() => {
        expect(getByText('dfo-mpo.gc.ca')).toBeInTheDocument()
      })
    })
  })
})
