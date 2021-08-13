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

import { AdminDomains } from '../../admin/AdminDomains'
import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import {
  rawOrgDomainListData,
  rawOrgDomainListDataEmpty,
} from '../../fixtures/orgDomainListData'
import { PAGINATED_ORG_DOMAINS_ADMIN_PAGE as FORWARD } from '../../graphql/queries'
import {
  CREATE_DOMAIN,
  REMOVE_DOMAIN,
  UPDATE_DOMAIN,
} from '../../graphql/mutations'

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
                  />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const addDomain = await findByText(/Add Domain/i)
      fireEvent.click(addDomain)

      await waitFor(() =>
        expect(getByText(/Add Domain Details/)).toBeInTheDocument(),
      )

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
              search: 'test-domain.gc.ca',
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

      const { getByText, getByRole, findByRole } = render(
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

      const domainUrlInput = await findByRole('textbox', {
        name: 'Search by Domain URL',
      })

      userEvent.type(domainUrlInput, 'test-domain.gc.ca')

      const addDomainButton = getByRole('button', { name: 'Add Domain' })
      userEvent.click(addDomainButton)

      await waitFor(() =>
        expect(getByText(/Add Domain Details/)).toBeInTheDocument(),
      )

      const confirmButton = getByRole('button', { name: /Confirm/ })
      userEvent.click(confirmButton)

      await waitFor(() =>
        expect(getByText(/Unable to create new domain./i)).toBeVisible(),
      )
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
        findByText,
        queryByText,
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

      const addDomainButton = await findByText(/Add Domain/)

      const domainInput = getByPlaceholderText('Domain URL')
      fireEvent.change(domainInput, {
        target: {
          value: 'test.domain.gc.ca',
        },
      })

      userEvent.click(addDomainButton)

      const confirmBtn = getByText(/Confirm/)
      fireEvent.click(confirmBtn)

      await waitFor(() => expect(getByText(/Domain added/i)).toBeVisible())

      await waitFor(() =>
        expect(queryByText('Add Domain Details')).not.toBeInTheDocument(),
      )
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
        getByTestId,
        getByPlaceholderText,
        queryAllByText,
        findByText,
        queryByText,
        getByRole,
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

      const addDomainBtn = await findByText(/Add Domain/)
      userEvent.click(addDomainBtn)

      await waitFor(() =>
        expect(getByText(/Add Domain Details/)).toBeInTheDocument(),
      )

      const domainInput = getByRole('textbox', { name: /New Domain URL/ })
      expect(domainInput).toBeInTheDocument()
      userEvent.type(domainInput, 'test.domain.gc.ca')

      const addSelectorBtn = getByTestId(/add-dkim-selector/)
      fireEvent.click(addSelectorBtn)

      const selectorInput = getByPlaceholderText(/DKIM Selector/)
      fireEvent.blur(selectorInput)

      await waitFor(() =>
        expect(getByText(/Selector cannot be empty/)).toBeInTheDocument(),
      )

      fireEvent.change(selectorInput, { target: { value: 'selector1' } })

      await waitFor(() =>
        expect(
          getByText(/Selector must be string ending in '._domainkey'/),
        ).toBeInTheDocument(),
      )

      fireEvent.change(selectorInput, {
        target: { value: 'selector1._domainkey' },
      })

      const confirmBtn = getByText(/Confirm/)
      fireEvent.click(confirmBtn)

      await waitFor(() => {
        const successMessages = queryAllByText(/Domain added/i)
        expect(successMessages[0]).toBeVisible()
      })

      await waitFor(() =>
        expect(queryByText('Add Domain Details')).not.toBeInTheDocument(),
      )
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

      const { getByText, findByTestId, queryAllByText, queryByText } = render(
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

      await waitFor(() => expect(getByText(/Add Domain/)).toBeInTheDocument())

      const removeDomain = await findByTestId('remove-1')
      fireEvent.click(removeDomain)

      await waitFor(() => {
        const removeText = getByText(/Confirm removal of domain:/i)
        expect(removeText).toBeInTheDocument()
      })

      const confirm = getByText('Confirm')
      fireEvent.click(confirm)

      await waitFor(() => {
        const removed = queryAllByText(/Domain removed/i)
        expect(removed[0]).toBeVisible()
      })

      await waitFor(() =>
        expect(queryByText('Remove Domain')).not.toBeInTheDocument(),
      )
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
              selectors: [],
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

      const { getByText, findByTestId, getByLabelText, queryByText } = render(
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

      const editDomainButton = await findByTestId('edit-1')
      userEvent.click(editDomainButton)

      await waitFor(() =>
        expect(getByText(/Edit Domain Details/i)).toBeInTheDocument(),
      )

      const editDomainInput = getByLabelText(/Domain URL:/)
      fireEvent.change(editDomainInput, {
        target: {
          value: 'test.domain.ca',
        },
      })

      const confirm = getByText('Confirm')
      fireEvent.click(confirm)

      await waitFor(() => expect(getByText(/Domain updated/)).toBeVisible())

      await waitFor(() =>
        expect(queryByText('Edit Domain Details')).not.toBeInTheDocument(),
      )
    })
  })
})
