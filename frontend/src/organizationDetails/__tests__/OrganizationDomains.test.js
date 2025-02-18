import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import matchMediaPolyfill from 'mq-polyfill'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { OrganizationDomains } from '../OrganizationDomains'

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
            variables: {
              slug: orgSlug,
              first: 50,
              orderBy: { field: 'DOMAIN', direction: 'ASC' },
              search: '',
              filters: [{ filterCategory: 'HTTPS_STATUS', comparison: 'NOT_EQUAL', filterValue: 'INFO' }],
            },
          },
          result: {
            data: {
              findOrganizationBySlug: {
                id: 'fdscdc',
                domains: {
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: 'YXJyYXljb25uZWN0aW9uOjgx',
                    hasPreviousPage: false,
                    startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                  },
                  edges: [
                    {
                      cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                      node: {
                        id: '185514a7-45d2-497f-9fb0-57970a96c7d4',
                        domain: 'dfo-mpo.gc.ca',
                        lastRan: '2020-04-27 23:23:44.565Z',
                        status: {
                          ciphers: 'PASS',
                          curves: 'PASS',
                          dkim: 'INFO',
                          dmarc: 'INFO',
                          hsts: 'FAIL',
                          https: 'FAIL',
                          policy: 'INFO',
                          protocols: 'FAIL',
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

      const router = createMemoryRouter(
        [
          {
            path: '/organizations/:orgSlug/:activeTab?',
            element: <OrganizationDomains orgSlug={orgSlug} />,
          },
        ],
        {
          initialEntries: ['/organizations/tbs-sct-gc-ca/domains'],
          initialIndex: 0,
        },
      )

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
                <RouterProvider router={router}>
                  <OrganizationDomains orgSlug={orgSlug} />
                </RouterProvider>
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
