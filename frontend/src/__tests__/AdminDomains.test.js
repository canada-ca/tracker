import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { UserStateProvider } from '../UserState'
import { setupI18n } from '@lingui/core'
import { AdminDomains } from '../AdminDomains'
import { MockedProvider } from '@apollo/client/testing'
import { createCache } from '../client'
import { PAGINATED_ORG_DOMAINS_ADMIN_PAGE as FORWARD } from '../graphql/queries'
import {
  rawOrgDomainListData,
  rawOrgDomainListDataEmpty,
} from '../fixtures/orgDomainListData'

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
      query: FORWARD,
      variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
    },
    result: { data: rawOrgDomainListData },
  },
]

describe('<AdminDomains />', () => {
  it('successfully renders with mocked data', async () => {
    const { getAllByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'testuser@testemail.gc.ca',
          jwt: 'string',
          tfaSendMethod: false,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']}>
              <MockedProvider mocks={mocks} cache={createCache()}>
                <AdminDomains
                  orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                  orgSlug="test-org.slug"
                  domainsPerPage={4}
                />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() => {
      const domains = getAllByText('canada.ca')
      expect(domains).toHaveLength(1)
    })
  })

  it(`gracefully handles a "no results" empty list`, async () => {
    const mocks = [
      {
        request: {
          query: FORWARD,
          variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
        },
        result: { data: rawOrgDomainListDataEmpty },
      },
    ]

    const { getByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'testuser@testemail.gc.ca',
          jwt: 'string',
          tfaSendMethod: false,
        }}
      >
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']}>
              <MockedProvider mocks={mocks} cache={createCache()}>
                <AdminDomains
                  orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                  orgSlug={'test-org.slug'}
                  domainsPerPage={4}
                />
              </MockedProvider>
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </UserStateProvider>,
    )

    await waitFor(() => {
      const nope = getByText(/No Domains/i)
      expect(nope).toBeInTheDocument()
    })
  })
})
