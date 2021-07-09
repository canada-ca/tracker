import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { UserVarProvider } from '../UserState'
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
      query: FORWARD,
      variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
    },
    result: { data: rawOrgDomainListData },
  },
]

describe('<AdminDomains />', () => {
  it('successfully renders with mocked data', async () => {
    const { getAllByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']}>
                <AdminDomains
                  orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                  orgSlug="test-org.slug"
                  domainsPerPage={4}
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
          variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
        },
        result: { data: rawOrgDomainListDataEmpty },
      },
    ]

    const { getByText } = render(
      <MockedProvider mocks={mocks} cache={createCache()}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']}>
                <AdminDomains
                  orgId={rawOrgDomainListData.findOrganizationBySlug.id}
                  orgSlug={'test-org.slug'}
                  domainsPerPage={4}
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
              selectors: [],
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
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        const addDomain = getByText(/Add Domain/i)
        fireEvent.click(addDomain)
      })

      await waitFor(() => {
        expect(getByText(/Add Domain Details/)).toBeInTheDocument()
        const confirmBtn = getByText(/Confirm/)
        fireEvent.click(confirmBtn)
      })

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
            variables: { first: 4, orgSlug: 'test-org.slug', search: '' },
          },
          result: { data: rawOrgDomainListData },
        },
        {
          request: {
            query: FORWARD,
            variables: {
              first: 4,
              orgSlug: 'test-org.slug',
              search: 'random text dot com',
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
              selectors: [],
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

      const { getByText, getByPlaceholderText } = render(
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
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        const domainInput = getByPlaceholderText('Domain URL')
        fireEvent.change(domainInput, {
          target: {
            value: 'random text dot com',
          },
        })
        const addDomain = getByText(/Add Domain/i)
        fireEvent.click(addDomain)
      })

      await waitFor(() => {
        expect(getByText(/Add Domain Details/)).toBeInTheDocument()
        const confirmBtn = getByText(/Confirm/)
        fireEvent.click(confirmBtn)
      })

      // await waitFor(() => {
      //   expect(getByText(/Unable to create new domain./i)).toBeInTheDocument()
      // })
    })

    it('returns a success when valid URL is given', async () => {
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
            query: FORWARD,
            variables: {
              first: 4,
              orgSlug: 'test-org.slug',
              search: 'test.domain.gc.ca',
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
              selectors: [],
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

      const {
        getByText,
        getByPlaceholderText,
        queryByText,
        queryAllByText,
      } = render(
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
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        expect(queryByText(/Add Domain/)).toBeInTheDocument()
      })

      const domainInput = getByPlaceholderText('Domain URL')
      fireEvent.change(domainInput, {
        target: {
          value: 'test.domain.gc.ca',
        },
      })

      await waitFor(() => {
        const addDomain = getByText(/Add Domain/)
        fireEvent.click(addDomain)
      })

      const confirmBtn = getByText(/Confirm/)
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        const successMessages = queryAllByText(/Domain added/i)
        expect(successMessages[0]).toBeInTheDocument()
      })
    })

    it('succeeds when DKIM selectors are added', async () => {
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
              selectors: ['selector1._domainkey'],
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

      const {
        getByText,
        getByLabelText,
        queryByText,
        getByTestId,
        getByPlaceholderText,
        queryAllByText,
      } = render(
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
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        expect(queryByText(/Add Domain/)).toBeInTheDocument()
      })

      const addDomainBtn = getByText(/Add Domain/)
      fireEvent.click(addDomainBtn)

      await waitFor(() => {
        expect(queryByText(/Add Domain Details/)).toBeInTheDocument()
      })

      const domainInput = getByLabelText(/Domain URL:/)
      fireEvent.change(domainInput, { target: { value: 'test.domain.gc.ca' } })

      const addSelectorBtn = getByTestId(/add-dkim-selector/)
      fireEvent.click(addSelectorBtn)

      await waitFor(() => {
        expect(queryByText(/Selector cannot be empty/)).toBeInTheDocument()
      })

      const selectorInput = getByPlaceholderText(/DKIM Selector/)
      fireEvent.change(selectorInput, { target: { value: 'selector1' } })

      await waitFor(() => {
        expect(
          queryByText(/Selector must be string ending in '._domainkey'/),
        ).toBeInTheDocument()
      })

      fireEvent.change(selectorInput, {
        target: { value: 'selector1._domainkey' },
      })

      const confirmBtn = getByText(/Confirm/)
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        const successMessages = queryAllByText(/Domain added/i)
        expect(successMessages[0]).toBeInTheDocument()
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

      const { getByText, getByTestId, queryByText, queryAllByText } = render(
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
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        expect(queryByText(/Add Domain/)).toBeInTheDocument()
      })

      const removeDomain = getByTestId('remove-1')
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

      const { getByText, getByLabelText, getByTestId } = render(
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
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      await waitFor(() => {
        const editDomain = getByTestId('edit-1')
        fireEvent.click(editDomain)
        const editText = getByText(/Edit Domain Details/i)
        expect(editText).toBeInTheDocument()
      })

      const editDomainInput = getByLabelText(/Domain URL:/)
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
