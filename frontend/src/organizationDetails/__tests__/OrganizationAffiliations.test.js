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

import { OrganizationAffiliations } from '../OrganizationAffiliations'

import { UserVarProvider } from '../../utilities/userState'
import { PAGINATED_ORG_AFFILIATIONS } from '../../graphql/queries'

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

describe('<OrganizationAffiliations />', () => {
  describe('given the url /organisations/tbs-sct-gc-ca', () => {
    it('displays user affiliations using the tbs-sct-gc-ca slug', async () => {
      window.resizeTo(1024, 768)

      const orgSlug = 'tbs-sct-gc-ca'
      const mocks = [
        {
          request: {
            query: PAGINATED_ORG_AFFILIATIONS,
            variables: {
              first: 50,
              slug: orgSlug,
              orderBy: { direction: 'ASC', field: 'PERMISSION' },
              search: '',
            },
          },
          result: {
            data: {
              findOrganizationBySlug: {
                id: 'testid',
                affiliations: {
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: 'string',
                    hasPreviousPage: false,
                    startCursor: 'string',
                  },
                  totalCount: 15,
                  edges: [
                    {
                      cursor: 'string',
                      node: {
                        permission: 'SUPER_ADMIN',
                        user: {
                          id: 'MjQyMzg1MTM1OQ==',
                          userName: 'Jabari_Larson@hotmail.com',
                          displayName: 'Jabari Larson',
                        },
                      },
                    },
                    {
                      cursor: 'string',
                      node: {
                        permission: 'SUPER_ADMIN',
                        user: {
                          id: 'NjYzODA5ODE1OA==',
                          userName: 'Joel_Nienow77@yahoo.com',
                          displayName: 'Joel Nienow',
                        },
                      },
                    },
                    {
                      cursor: 'string',
                      node: {
                        permission: 'ADMIN',
                        user: {
                          id: 'NzQyMzU3NDYzMw==',
                          userName: 'Cara.Olson81@yahoo.com',
                          displayName: 'Cara Olson',
                        },
                      },
                    },
                    {
                      cursor: 'string',
                      node: {
                        permission: 'USER',
                        user: {
                          id: 'Nzc0Mjg2MjM2Ng==',
                          userName: 'Rahul.Wintheiser10@yahoo.com',
                          displayName: 'Rahul Wintheiser',
                        },
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
            element: <OrganizationAffiliations orgSlug={orgSlug} />,
          },
        ],
        {
          initialEntries: ['/organizations/tbs-sct-gc-ca/users'],
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
                  <OrganizationAffiliations orgSlug={orgSlug} />
                </RouterProvider>
              </UserVarProvider>
            </MockedProvider>
          </I18nProvider>
        </ChakraProvider>,
      )

      await waitFor(() => {
        expect(getByText('Jabari_Larson@hotmail.com')).toBeInTheDocument()
      })
      await waitFor(() => {
        expect(getByText('Cara Olson')).toBeInTheDocument()
      })
    })
  })
})
