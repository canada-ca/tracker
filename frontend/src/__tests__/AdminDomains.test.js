import React from 'react'
import { waitFor, render, fireEvent } from '@testing-library/react'
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
      variables: { first: 4, orgSlug: 'test-org.slug' },
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
          variables: { first: 4, orgSlug: 'test-org.slug' },
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

  // TODO pagination

  // TODO createDomain mutation
  describe('adding a domain', () => {
    it('returns an error when no input is given', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 4, orgSlug: 'test-org.slug' },
          },
          result: { data: rawOrgDomainListData },
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
        const addDomain = getByText(/Add Domain/i)
        fireEvent.click(addDomain)
        const error = getByText(/Domain url field must not be empty/i)
        expect(error).toBeInTheDocument()
      })
    })

    it('returns an error when incorrect input is given', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 4, orgSlug: 'test-org.slug' },
          },
          result: { data: rawOrgDomainListData },
        },
      ]

      const { getByText, getByLabelText } = render(
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
        const domainInput = getByLabelText('domain-input')
        fireEvent.change(domainInput, {
          target: {
            value: 'random text dot com',
          },
        })
        const addDomain = getByText(/Add Domain/i)
        fireEvent.click(addDomain)
        const error = getByText(/An error occurred./i)
        expect(error).toBeInTheDocument()
      })
    })

    it('returns a success when correct input is given', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 4, orgSlug: 'test-org.slug' },
          },
          result: { data: rawOrgDomainListData },
        },
      ]

      const { getByText, getByLabelText } = render(
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
        const domainInput = getByLabelText('domain-input')
        fireEvent.change(domainInput, {
          target: {
            value: 'www.test.domain.gc.ca',
          },
        })
        const addDomain = getByText(/Add Domain/i)
        fireEvent.click(addDomain)
        // const error = getByText(/Domain added/i)
        // expect(error).toBeInTheDocument()
      })
    })
  })

  // TODO removeDomain mutation
  describe('removing a domain', () => {
    it('successfully removes domain from list', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 4, orgSlug: 'test-org.slug' },
          },
          result: { data: rawOrgDomainListData },
        },
      ]

      const { getByText, getByLabelText } = render(
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
        const removeDomain = getByLabelText('remove-1')
        fireEvent.click(removeDomain)
        const removeText = getByText(/Confirm removal of domain:/i)
        expect(removeText).toBeInTheDocument()
        const confirm = getByText('Confirm')
        fireEvent.click(confirm)
        // const error = getByText(/Domain removed/i)
        // expect(error).toBeInTheDocument()
      })
    })
  })

  // TODO updateDomain mutation
  describe('editing a domain', () => {
    it('returns an error when no input is given', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 4, orgSlug: 'test-org.slug' },
          },
          result: { data: rawOrgDomainListData },
        },
      ]

      const { getByText, getByLabelText } = render(
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
        const editDomain = getByLabelText('edit-1')
        fireEvent.click(editDomain)
        const editText = getByText(/Edit Domain Details/i)
        expect(editText).toBeInTheDocument()
        const confirm = getByText('Confirm')
        fireEvent.click(confirm)
        // const error = getByText(/An error occurred./i)
        // expect(error).toBeInTheDocument()
      })
    })

    it('successfully edits domain URL', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 4, orgSlug: 'test-org.slug' },
          },
          result: { data: rawOrgDomainListData },
        },
      ]

      const { getByText, getByLabelText } = render(
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
        const editDomain = getByLabelText('edit-1')
        fireEvent.click(editDomain)
        const editText = getByText(/Edit Domain Details/i)
        expect(editText).toBeInTheDocument()

        const editDomainInput = getByLabelText('new-domain-url')
        fireEvent.change(editDomainInput, {
          target: {
            value: 'random text dot com',
          },
        })
        const confirm = getByText('Confirm')
        fireEvent.click(confirm)
        // const error = getByText(/An error occurred./i)
        // expect(error).toBeInTheDocument()
      })
    })

    it('successfully edits domain URL', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 4, orgSlug: 'test-org.slug' },
          },
          result: { data: rawOrgDomainListData },
        },
      ]

      const { getByText, getByLabelText } = render(
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
        const editDomain = getByLabelText('edit-1')
        fireEvent.click(editDomain)
        const editText = getByText(/Edit Domain Details/i)
        expect(editText).toBeInTheDocument()

        const editDomainInput = getByLabelText('new-domain-url')
        fireEvent.change(editDomainInput, {
          target: {
            value: 'test.domain.gc.ca',
          },
        })
        const confirm = getByText('Confirm')
        fireEvent.click(confirm)
        // const error = getByText(/Domain updated/i)
        // expect(error).toBeInTheDocument()
      })
    })
  })
})
