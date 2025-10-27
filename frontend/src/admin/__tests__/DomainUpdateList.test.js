import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { en } from 'make-plural/plurals'
import { DomainUpdateList } from '../DomainUpdateList'
import { UPDATE_DOMAINS_BY_DOMAIN_IDS, UPDATE_DOMAINS_BY_FILTERS } from '../../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: { en: {} },
  localeData: { en: { plurals: en } },
})

const domains = [
  { id: '1', domain: 'example.com', tags: ['tag1'] },
  { id: '2', domain: 'test.com', tags: ['tag2'] },
]
const availableTags = [
  { label: 'Tag 1', tagId: 'tag1' },
  { label: 'Tag 2', tagId: 'tag2' },
]
const filters = []
const orgId = 'org-1'
const search = ''
const domainCount = 2

const mocks = [
  {
    request: {
      query: UPDATE_DOMAINS_BY_DOMAIN_IDS,
      variables: { domainIds: ['1'], tags: ['tag1'], orgId },
    },
    result: {
      data: {
        updateDomainsByDomainIds: {
          result: {
            __typename: 'DomainBulkResult',
            status: 'Success',
          },
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_DOMAINS_BY_FILTERS,
      variables: { filters, search, tags: ['tag1'], orgId },
    },
    result: {
      data: {
        updateDomainsByFilters: {
          result: {
            __typename: 'DomainBulkResult',
            status: 'Success',
          },
        },
      },
    },
  },
]

describe('<DomainUpdateList />', () => {
  it('renders domain rows and select all', () => {
    const { getByText, getByLabelText } = render(
      <MockedProvider mocks={[]}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={domains}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={domainCount}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    expect(getByText('example.com')).toBeInTheDocument()
    expect(getByText('test.com')).toBeInTheDocument()
    expect(getByLabelText(/Select All/i)).toBeInTheDocument()
  })

  it('selects a domain and opens tag drawer', async () => {
    const { getAllByRole, getByText, getByRole } = render(
      <MockedProvider mocks={mocks}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={domains}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={domainCount}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    const checkboxes = getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // select first domain
    const tagBtn = getByRole('button', { name: /Tag Assets/i })
    fireEvent.click(tagBtn)
    await waitFor(() => expect(getByText(/Apply Tags/i)).toBeInTheDocument())
  })

  it('applies tags to selected domains', async () => {
    const { getAllByRole, getByRole, getByText, getByLabelText, _getByRole } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={domains}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={domainCount}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    const checkboxes = getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // select first domain
    fireEvent.click(getByRole('button', { name: /Tag Assets/i }))
    await waitFor(() => getByText(/Apply Tags/i))
    fireEvent.click(getByLabelText('TAG 1'))
    fireEvent.click(getByRole('button', { name: /Apply/i }))
    await waitFor(() => getByText(/Are you sure\?/i))
    fireEvent.click(getByRole('button', { name: /Yes, Apply/i }))
    await waitFor(() => getByText(/Domains updated/i))
  })

  it('applies tags to all filtered domains when select all is checked', async () => {
    const { getAllByRole, getByRole, getByText, getByLabelText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={domains}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={domainCount}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    const selectAll = getAllByRole('checkbox')[0]
    fireEvent.click(selectAll)
    fireEvent.click(getByRole('button', { name: /Tag Assets/i }))
    await waitFor(() => getByText(/Apply Tags/i))
    fireEvent.click(getByLabelText('TAG 1'))
    fireEvent.click(getByRole('button', { name: /Apply/i }))
    await waitFor(() => getByText(/Are you sure\?/i))
    fireEvent.click(getByRole('button', { name: /Yes, Apply/i }))
    await waitFor(() => getByText(/Domains updated/i))
  })

  it('shows error toast on mutation error', async () => {
    const errorMocks = [
      {
        request: {
          query: UPDATE_DOMAINS_BY_DOMAIN_IDS,
          variables: { domainIds: ['1'], tags: ['tag1'], orgId },
        },
        error: new Error('Test error'),
      },
    ]
    const { getAllByRole, getByText, getByRole, getByLabelText } = render(
      <MockedProvider mocks={errorMocks} addTypename={false}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={domains}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={domainCount}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    const checkboxes = getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    fireEvent.click(getByRole('button', { name: 'Tag Assets' }))
    await waitFor(() => getByText(/Apply Tags/i))
    fireEvent.click(getByLabelText('TAG 1'))
    fireEvent.click(getByRole('button', { name: 'Apply' }))
    await waitFor(() => getByText(/Are you sure\?/i))
    fireEvent.click(getByRole('button', { name: 'Yes, Apply' }))
    await waitFor(() => getByText(/An error occurred/i))
  })
})
