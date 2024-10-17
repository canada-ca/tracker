import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import AdminPage from '../AdminPage'
import { waitFor, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import userEvent from '@testing-library/user-event'

import { UserVarProvider } from '../../utilities/userState'
import { TourProvider } from '../../userOnboarding/contexts/TourContext'

import {
  ADMIN_PAGE,
  ORGANIZATION_INFORMATION,
  PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE,
  PAGINATED_ORG_DOMAINS_ADMIN_PAGE,
} from '../../graphql/queries'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('<AdminPage />', () => {
  it('shows a list of the users organizations', async () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks()} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <I18nProvider i18n={i18n}>
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin/organizations']} initialIndex={0}>
                <TourProvider>
                  <AdminPage />
                </TourProvider>
              </MemoryRouter>
            </ChakraProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      const welcome = getByText(/Select an organization to view admin options/i)
      expect(welcome).toBeInTheDocument()
    })
  })

  it('displays info for admin', async () => {
    const { getByText, findByRole } = render(
      <MockedProvider mocks={mocks()} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <I18nProvider i18n={i18n}>
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin/organizations']} initialIndex={0}>
                <TourProvider>
                  <AdminPage />
                </TourProvider>
              </MemoryRouter>
            </ChakraProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    const organizationInput = await findByRole('textbox', {
      name: /Organization/,
    })
    userEvent.click(organizationInput)

    await waitFor(() => {
      expect(getByText(/Wolf Group/)).toBeInTheDocument()
    })
    const orgEntry = getByText(/Wolf Group/)
    userEvent.click(orgEntry)

    await waitFor(() => {
      expect(getByText(/Slug:/i)).toHaveTextContent(/Slug: Wolf-Group/i)
    })
  })

  it('filters organization list', async () => {
    const { getByText, queryByText, findByRole } = render(
      <MockedProvider mocks={mocks()} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <I18nProvider i18n={i18n}>
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin/organizations']} initialIndex={0}>
                <TourProvider>
                  <AdminPage />
                </TourProvider>
              </MemoryRouter>
            </ChakraProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    const organizationInput = await findByRole('textbox', {
      name: /Organization/,
    })

    userEvent.click(organizationInput)

    await waitFor(() => {
      expect(getByText(/Wolf Group/)).toBeInTheDocument()
      expect(getByText(/Hane - Pollich/)).toBeInTheDocument()
    })

    userEvent.type(organizationInput, 'Wolf Group')

    await waitFor(() => {
      expect(getByText(/Wolf Group/)).toBeInTheDocument()
      expect(queryByText(/Hane - Pollich/)).not.toBeInTheDocument()
    })
  })
})

function mocks() {
  return [
    {
      request: {
        query: ADMIN_PAGE,
        variables: {
          first: 100,
          orderBy: {
            field: 'NAME',
            direction: 'ASC',
          },
          isAdmin: true,
          includeSuperAdminOrg: true,
          search: '',
        },
      },
      result: {
        data: {
          findMyOrganizations: {
            edges: [
              {
                node: {
                  id: '39ac4aac-e559-4f9f-8c83-a3d38976fe48',
                  acronym: 'CSIS',
                  slug: 'Hane---Pollich',
                  name: 'Hane - Pollich',
                },
              },
              {
                node: {
                  id: '9ceb4c07-8034-4588-824c-f71313cd9e08',
                  acronym: 'HC',
                  slug: 'Wolf-Group',
                  name: 'Wolf Group',
                },
              },
              {
                node: {
                  id: 'a1d935e3-02fe-4001-9161-5d3c68b62b8e',
                  acronym: 'TBS',
                  slug: 'Goodwin---OConnell',
                  name: "Goodwin - O'Connell",
                },
              },
            ],
          },
          isUserSuperAdmin: true,
        },
      },
    },
    {
      request: {
        query: ADMIN_PAGE,
        variables: {
          first: 100,
          orderBy: {
            field: 'NAME',
            direction: 'ASC',
          },
          isAdmin: true,
          includeSuperAdminOrg: true,
          search: 'Wolf Group',
        },
      },
      result: {
        data: {
          findMyOrganizations: {
            edges: [
              {
                node: {
                  id: '9ceb4c07-8034-4588-824c-f71313cd9e08',
                  acronym: 'HC',
                  slug: 'Wolf-Group',
                  name: 'Wolf Group',
                },
              },
            ],
          },
          isUserSuperAdmin: true,
        },
      },
    },
    {
      request: {
        query: ORGANIZATION_INFORMATION,
        variables: { orgSlug: 'Wolf-Group' },
      },
      result: {
        data: {
          findOrganizationBySlug: {
            id: 'dd725149-d6ca-4f46-9a08-a6cf984b719e',
            acronym: 'WOLFGROUP',
            name: 'Wolf Group',
            slug: 'Wolf-Group',
            zone: 'WGZone',
            sector: 'WGSector',
            country: 'WGCountry',
            province: 'WGProvince',
            city: 'WGCity',
            verified: true,
            __typename: 'Organization',
          },
        },
      },
    },
    {
      request: {
        query: PAGINATED_ORG_DOMAINS_ADMIN_PAGE,
        variables: {
          first: 50,
          orgSlug: 'Wolf-Group',
          search: '',
          orderBy: { field: 'DOMAIN', direction: 'ASC' },
          filters: [],
        },
      },
      result: {
        data: {
          findOrganizationBySlug: {
            id: 'dd725149-d6ca-4f46-9a08-a6cf984b719e',
            name: 'Wolf Group',
            domains: {
              edges: [
                {
                  node: {
                    id: 'e86770be-b13e-4bee-b833-6a2e31add85c',
                    domain: 'antonia.name',
                    lastRan: '2020-08-13T14:42:03.385294',
                    selectors: ['selector9', 'selector7'],
                    __typename: 'Domain',
                  },
                  __typename: 'DomainEdge',
                },
                {
                  node: {
                    id: '11494bbf-1ed6-4edb-b96f-3fed6f36a226',
                    domain: 'blaise.biz',
                    lastRan: '2020-08-13T14:42:03.385294',
                    selectors: ['selector3', 'selector5'],
                    __typename: 'Domain',
                  },
                  __typename: 'DomainEdge',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'Hello World',
                endCursor: 'Hello World',
                __typename: 'PageInfo',
              },
              totalCount: 2,
              __typename: 'DomainConnection',
            },
            __typename: 'Organization',
          },
        },
      },
    },
    {
      request: {
        query: PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE,
        variables: {
          orgSlug: 'Wolf-Group',
          first: 50,
          search: '',
          includePending: true,
          orderBy: { field: 'PERMISSION', direction: 'ASC' },
        },
      },
      result: {
        data: {
          findOrganizationBySlug: {
            id: 'dd725149-d6ca-4f46-9a08-a6cf984b719e',
            affiliations: {
              edges: [
                {
                  node: {
                    id: '4f105cd9-e625-4fa7-9617-e574bff4cb2a',
                    permission: 'USER',
                    user: {
                      id: '8f014942-f585-49cf-98fa-069f136aab73',
                      userName: 'Joseph.Grimes@hotmail.com',
                      displayName: 'Larry Klein',
                      __typename: 'SharedUser',
                    },
                    __typename: 'Affiliation',
                  },
                  __typename: 'AffiliationEdge',
                },
                {
                  node: {
                    id: '9772d2ad-4687-423c-9c6e-4daa1f716591',
                    permission: 'ADMIN',
                    user: {
                      id: '4a8ee5ca-a255-48bb-a3a1-1a3c74a4b6e2',
                      userName: 'Roosevelt_Windler57@yahoo.com',
                      displayName: 'Woodrow Jerde Jr.',
                      __typename: 'SharedUser',
                    },
                    __typename: 'Affiliation',
                  },
                  __typename: 'AffiliationEdge',
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'Hello World',
                endCursor: 'Hello World',
                __typename: 'PageInfo',
              },
              totalCount: 2,
              __typename: 'AffiliationConnection',
            },
            __typename: 'Organization',
          },
        },
      },
    },
  ]
}
