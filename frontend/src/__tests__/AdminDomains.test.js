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
  CREATE_DOMAIN,
  REMOVE_DOMAIN,
  UPDATE_DOMAIN,
} from '../graphql/mutations'
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

  // TODO pagination

  // TODO createDomain mutation
  describe('adding a domain', () => {
    it('returns an error when no input is given', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: CREATE_DOMAIN,
            variables: {
              orgId: 'gwdsfgvwsdgfvswefgdv',
              domain: 'test-domain.gc.ca',
            },
          },
          result: {
            data: {
              createDomain: {
                result: {
                  domain: 'lauretta.name',
                  __typename: 'Domain',
                },
                __typename: 'CreateDomainPayload',
              },
            },
          },
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
            variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: CREATE_DOMAIN,
            variables: {
              orgId: 'gwdsfgvwsdgfvswefgdv',
              domain: 'test-domain.gc.ca',
            },
          },
          result: {
            data: {
              createDomain: {
                result: {
                  code: -9,
                  description: 'Hello World',
                  __typename: 'DomainError',
                },
                __typename: 'CreateDomainPayload',
              },
            },
          },
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
            variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: CREATE_DOMAIN,
            variables: {
              orgId: rawOrgDomainListData.findOrganizationBySlug.id,
              domain: 'test.domain.gc.ca',
            },
          },
          result: {
            data: {
              createDomain: {
                result: {
                  domain: 'lauretta.name',
                  __typename: 'Domain',
                },
                __typename: 'CreateDomainPayload',
              },
            },
          },
        },
      ]

      const { getByText, getByLabelText, queryByText } = render(
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
        expect(queryByText(/Add Domain/)).toBeInTheDocument()
      })

      const domainInput = getByLabelText('domain-input')
      fireEvent.change(domainInput, {
        target: {
          value: 'test.domain.gc.ca',
        },
      })

      const addDomain = getByText(/Add Domain/i)
      fireEvent.click(addDomain)

      // await waitFor(() => {
      //   expect(queryByText(/Domain added/i)).toBeInTheDocument()
      // })
    })
  })

  // TODO removeDomain mutation
  describe('removing a domain', () => {
    it('successfully removes domain from list', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: REMOVE_DOMAIN,
            variables: { domainId: 'testid2=', orgId: 'testid=' },
          },
          result: {
            data: {
              removeDomain: {
                result: {
                  status: 'Hello World',
                  __typename: 'DomainResult',
                },
                __typename: 'RemoveDomainPayload',
              },
            },
          },
        },
      ]

      const { getByText, getByLabelText, queryByText, queryAllByText } = render(
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
        expect(queryByText(/Add Domain/)).toBeInTheDocument()
      })

      const removeDomain = getByLabelText('remove-1')
      fireEvent.click(removeDomain)

      await waitFor(() => {
        const removeText = getByText(/Confirm removal of domain:/i)
        expect(removeText).toBeInTheDocument()
      })

      const confirm = getByText('Confirm')
      fireEvent.click(confirm)
      await waitFor(() => {
        const removed = queryAllByText(/Domain removed/i)
        expect(removed[0]).toBeInTheDocument()
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
            variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
          },
          result: { data: rawOrgDomainListData },
        },
      ]

      const { getByText, getByLabelText, getAllByText } = render(
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
        const error = getAllByText(/Domain url field must not be empty/i)
        expect(error[0]).toBeInTheDocument()
      })
    })

    it('successfully edits domain URL', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: UPDATE_DOMAIN,
            variables: {
              domainId: 'testid2=',
              orgId: 'testid=',
              domain: 'test.domain.ca',
            },
          },
          result: {
            data: {
              updateDomain: {
                result: {
                  domain: 'ethyl.org',
                  __typename: 'Domain',
                },
                __typename: 'UpdateDomainPayload',
              },
            },
          },
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
      })

      const editDomainInput = getByLabelText(/New Domain Url:/)
      fireEvent.change(editDomainInput, {
        target: {
          value: 'test.domain.ca',
        },
      })

      const confirm = getByText('Confirm')
      fireEvent.click(confirm)

      // await waitFor(() => {
      //   expect(queryByText(/An error occured./)).toBeInTheDocument()
      // })
    })
  })
})
