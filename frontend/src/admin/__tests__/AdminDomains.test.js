import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'
import userEvent from '@testing-library/user-event'
import { en } from 'make-plural/plurals'

import { AdminDomains } from '../AdminDomains'

import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import { rawOrgDomainListData, rawOrgDomainListDataEmpty } from '../../fixtures/orgDomainListData'
import { PAGINATED_ORG_DOMAINS_ADMIN_PAGE as FORWARD } from '../../graphql/queries'
import { CREATE_DOMAIN, REMOVE_DOMAIN, UPDATE_DOMAIN } from '../../graphql/mutations'

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
      query: FORWARD,
      variables: {
        first: 50,
        orgSlug: 'test-org.slug',
        search: '',
        orderBy: { field: 'DOMAIN', direction: 'ASC' },
        filters: [],
      },
    },
    result: { data: rawOrgDomainListData },
  },
]

describe('<AdminDomains />', () => {
  it('successfully renders with mocked data', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']}>
                <AdminDomains
                  orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                  orgSlug="test-org.slug"
                  domainsPerPage={4}
                  availableTags={rawOrgDomainListData.findOrganizationBySlug.availableTags}
                />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
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
          variables: {
            first: 50,
            orgSlug: 'test-org.slug',
            search: '',
            orderBy: { field: 'DOMAIN', direction: 'ASC' },
            filters: [],
          },
        },
        result: { data: rawOrgDomainListDataEmpty },
      },
    ]

    const { getByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']}>
                <AdminDomains
                  orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                  orgSlug={'test-org.slug'}
                  domainsPerPage={4}
                  availableTags={rawOrgDomainListData.findOrganizationBySlug.availableTags}
                />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
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
            variables: {
              first: 50,
              orgSlug: 'test-org.slug',
              search: '',
              orderBy: { field: 'DOMAIN', direction: 'ASC' },
              filters: [],
            },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: CREATE_DOMAIN,
            variables: {
              orgId: 'gwdsfgvwsdgfvswefgdv',
              domain: 'test-domain.gc.ca',
              tags: [],
              archived: false,
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

      const { getByText, findByText } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']}>
                  <AdminDomains
                    orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                    orgSlug={'test-org.slug'}
                    domainsPerPage={4}
                    availableTags={rawOrgDomainListData.findOrganizationBySlug.availableTags}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const addDomain = await findByText(/Add Domain/i)
      fireEvent.click(addDomain)

      await waitFor(() => expect(getByText(/Add Domain Details/)).toBeInTheDocument())

      const confirmBtn = getByText(/Confirm/)
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        const error = getByText(/Domain url field must not be empty/i)
        expect(error).toBeInTheDocument()
      })
    })

    it('returns an error when incorrect input is given', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: {
              first: 50,
              orgSlug: 'test-org.slug',
              search: '',
              orderBy: { field: 'DOMAIN', direction: 'ASC' },
              filters: [],
            },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: FORWARD,
            variables: {
              first: 50,
              orgSlug: 'test-org.slug',
              search: '',
              orderBy: { field: 'DOMAIN', direction: 'ASC' },
              filters: [],
            },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: CREATE_DOMAIN,
            variables: {
              orgId: 'testid=',
              domain: 'test-domain.gc.ca',
              tags: [],
              archived: false,
              assetState: 'APPROVED',
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

      const { getByText, getByRole } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']}>
                  <AdminDomains
                    orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                    orgSlug={'test-org.slug'}
                    domainsPerPage={4}
                    availableTags={rawOrgDomainListData.findOrganizationBySlug.availableTags}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const domainUrlInput = getByRole('textbox', {
        name: 'Search by Domain URL',
      })

      userEvent.type(domainUrlInput, 'test-domain.gc.ca')

      const addDomainButton = getByRole('button', { name: 'Add Domain' })
      userEvent.click(addDomainButton)

      await waitFor(() => expect(getByText(/Add Domain Details/)).toBeInTheDocument())

      const confirmButton = getByRole('button', { name: /Confirm/ })
      userEvent.click(confirmButton)

      await waitFor(() => expect(getByText(/Unable to create new domain./i)).toBeInTheDocument())
    })

    it('returns a success when valid URL is given', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: {
              first: 50,
              orgSlug: 'test-org.slug',
              search: '',
              orderBy: { field: 'DOMAIN', direction: 'ASC' },
              filters: [],
            },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: FORWARD,
            variables: {
              first: 50,
              orgSlug: 'test-org.slug',
              search: '',
              orderBy: { field: 'DOMAIN', direction: 'ASC' },
              filters: [],
            },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: CREATE_DOMAIN,
            variables: {
              orgId: rawOrgDomainListData.findOrganizationBySlug.id,
              domain: 'test.domain.gc.ca',
              tags: [],
              archived: false,
              assetState: 'APPROVED',
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

      const { getByText, getByPlaceholderText, findByText, queryByText, findByRole } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
              insideUser: true,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']}>
                  <AdminDomains
                    orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                    orgSlug={'test-org.slug'}
                    domainsPerPage={4}
                    availableTags={rawOrgDomainListData.findOrganizationBySlug.availableTags}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const addDomainButton = await findByText(/Add Domain/)

      const domainInput = getByPlaceholderText('Domain URL')
      fireEvent.change(domainInput, {
        target: {
          value: 'test.domain.gc.ca',
        },
      })

      userEvent.click(addDomainButton)

      await waitFor(() => expect(getByText(/Add Domain Details/i)).toBeInTheDocument())

      const assetStateSelect = await findByRole('combobox', { name: /Asset State/ })

      fireEvent.change(assetStateSelect, {
        target: {
          value: 'APPROVED',
        },
      })

      const confirmBtn = getByText(/Confirm/)
      fireEvent.click(confirmBtn)

      await waitFor(() => expect(getByText(/Domain added/i)).toBeInTheDocument())

      await waitFor(() => expect(queryByText('Add Domain Details')).not.toBeInTheDocument())
    })
  })

  describe('removing a domain', () => {
    it('successfully removes domain from list', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: {
              first: 50,
              orgSlug: 'test-org.slug',
              search: '',
              orderBy: { field: 'DOMAIN', direction: 'ASC' },
              filters: [],
            },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: REMOVE_DOMAIN,
            variables: {
              domainId: 'testid2=',
              orgId: 'testid=',
              reason: 'WRONG_ORG',
            },
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

      const { getByText, findByTestId } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']}>
                  <AdminDomains
                    orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                    orgSlug={'test-org.slug'}
                    domainsPerPage={4}
                    availableTags={rawOrgDomainListData.findOrganizationBySlug.availableTags}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => expect(getByText(/Add Domain/)).toBeInTheDocument())

      const removeDomain = await findByTestId('remove-1')
      fireEvent.click(removeDomain)

      await waitFor(() => {
        const removeText = getByText(/Confirm removal of domain:/i)
        expect(removeText).toBeInTheDocument()
      })

      const confirm = getByText('Confirm')
      fireEvent.click(confirm)
    })
  })

  describe('editing a domain', () => {
    it('successfully edits domain details', async () => {
      const mocks = [
        {
          request: {
            query: FORWARD,
            variables: {
              first: 50,
              orgSlug: 'test-org.slug',
              search: '',
              orderBy: { field: 'DOMAIN', direction: 'ASC' },
              filters: [],
            },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: UPDATE_DOMAIN,
            variables: {
              domainId: 'testid2=',
              orgId: 'testid=',
              tags: [],
              archived: false,
              assetState: 'MONITOR_ONLY',
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

      const { getByText, findByTestId, queryByText, findByRole } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
              insideUser: true,
            })}
          >
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']}>
                  <AdminDomains
                    orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                    orgSlug={'test-org.slug'}
                    domainsPerPage={4}
                    availableTags={rawOrgDomainListData.findOrganizationBySlug.availableTags}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const editDomainButton = await findByTestId('edit-1')
      userEvent.click(editDomainButton)

      await waitFor(() => expect(getByText(/Edit Domain Details/i)).toBeInTheDocument())

      const assetStateSelect = await findByRole('combobox', { name: /Asset State/ })

      fireEvent.change(assetStateSelect, {
        target: {
          value: 'MONITOR_ONLY',
        },
      })

      const confirm = getByText('Confirm')
      fireEvent.click(confirm)

      await waitFor(() => expect(getByText(/Domain updated/)).toBeInTheDocument())

      await waitFor(() => expect(queryByText('Edit Domain Details')).not.toBeInTheDocument())
    })
  })
})
