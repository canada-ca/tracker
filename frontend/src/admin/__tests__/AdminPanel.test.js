import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { AdminPanel } from '../AdminPanel'

import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import { rawOrgDomainListData } from '../../fixtures/orgDomainListData'
import { rawOrgUserListData } from '../../fixtures/orgUserListData'
import { PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE, PAGINATED_ORG_DOMAINS_ADMIN_PAGE } from '../../graphql/queries'
import { TourProvider } from '../../userOnboarding/contexts/TourContext'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const mocks = [
  {
    request: {
      query: PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE,
      variables: { first: 4, orgSlug: 'test-org.slug' },
    },
    result: { data: rawOrgUserListData },
  },
  {
    request: {
      query: PAGINATED_ORG_DOMAINS_ADMIN_PAGE,
      variables: { first: 4, orgSlug: 'test-org.slug' },
    },
    result: { data: rawOrgDomainListData },
  },
]

const router = createMemoryRouter(
  [
    {
      path: '/reset-password/:resetToken',
      element: (
        <AdminPanel orgSlug="test-org.slug" permission="ADMIN" orgId={rawOrgDomainListData.findOrganizationBySlug.id} />
      ),
    },
  ],
  {
    initialEntries: ['/reset-password/fwsdGDFSGSDVA.gedafbedafded.bgdbsedbeagbe'],
    initialIndex: 0,
  },
)

describe('<AdminPanel />', () => {
  it('renders both a domain list and user list', async () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <I18nProvider i18n={i18n}>
            <ChakraProvider theme={theme}>
              <TourProvider>
                <RouterProvider router={router}>
                  <AdminPanel
                    orgSlug="test-org.slug"
                    permission="ADMIN"
                    orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                  />
                </RouterProvider>
              </TourProvider>
            </ChakraProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => {
      expect(getByText('Domains')).toBeInTheDocument()
      expect(getByText('Users')).toBeInTheDocument()
    })
  })
})
