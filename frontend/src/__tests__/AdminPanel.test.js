import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MockedProvider } from '@apollo/client/testing'
import AdminPanel from '../AdminPanel'
import { MemoryRouter, Route } from 'react-router-dom'
import { rawOrgDomainListData } from '../fixtures/orgDomainListData'
import { rawOrgUserListData } from '../fixtures/orgUserListData'
import {
  PAGINATED_ORG_DOMAINS_ADMIN_PAGE,
  PAGINATED_ORG_AFFILIATIONS_ADMIN_PAGE,
} from '../graphql/queries'
import { client, createCache } from '../client'
import { ApolloProvider } from '@apollo/client'

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
      <ApolloProvider client={client}>
        <UserStateProvider
          initialState={{
            userName: 'testuser@testemail.gc.ca',
            jwt: 'string',
            tfaSendMethod: false,
          }}
        >
          <I18nProvider i18n={i18n}>
            <ThemeProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin']} initialIndex={0}>
                <Route path="/admin">
                  <MockedProvider mocks={mocks} cache={createCache()}>
                    <AdminPanel
                      orgSlug="test-org.slug"
                      permission="ADMIN"
                      orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                    />
                  </MockedProvider>
                </Route>
              </MemoryRouter>
            </ThemeProvider>
          </I18nProvider>
        </UserStateProvider>
      </ApolloProvider>,
    )
    await waitFor(() => {
      expect(getByText('Domains')).toBeInTheDocument()
      expect(getByText('Users')).toBeInTheDocument()
    })
  })
})
