import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ThemeProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserVarProvider } from '../UserState'
import { MockedProvider } from '@apollo/client/testing'
import AdminPanel from '../AdminPanel'
import { MemoryRouter, Route } from 'react-router-dom'
import { rawOrgDomainListData } from '../fixtures/orgDomainListData'
import { rawOrgUserListData } from '../fixtures/orgUserListData'
import {
  PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE,
  PAGINATED_ORG_DOMAINS_ADMIN_PAGE,
} from '../graphql/queries'
import { createCache } from '../client'
import { makeVar } from '@apollo/client'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
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

describe('<AdminPanel />', () => {
  it('renders both a domain list and user list', async () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <I18nProvider i18n={i18n}>
            <ThemeProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin']} initialIndex={0}>
                <Route path="/admin">
                  <AdminPanel
                    orgSlug="test-org.slug"
                    permission="ADMIN"
                    orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                  />
                </Route>
              </MemoryRouter>
            </ThemeProvider>
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
