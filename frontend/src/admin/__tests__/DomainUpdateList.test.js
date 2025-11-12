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
  // Added mock for select-all (multiple domainIds)
  {
    request: {
      query: UPDATE_DOMAINS_BY_DOMAIN_IDS,
      variables: { domainIds: ['1', '2'], tags: ['tag1'], orgId },
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
    const resetToFirstPage = jest.fn()
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
              resetToFirstPage={resetToFirstPage}
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
    const resetToFirstPage = jest.fn()
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
              resetToFirstPage={resetToFirstPage}
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
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Domains updated/i)
    })
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

  it('selects multiple domains across pages and preserves selection', () => {
    // Simulate two pages of domains
    const page1 = [
      { id: '1', domain: 'example.com', tags: ['tag1'] },
      { id: '2', domain: 'test.com', tags: ['tag2'] },
    ]
    const page2 = [
      { id: '3', domain: 'foo.com', tags: ['tag1'] },
      { id: '4', domain: 'bar.com', tags: ['tag2'] },
    ]
    // Render page 1
    const { getAllByRole, rerender, getByText, getAllByText } = render(
      <MockedProvider mocks={mocks}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={page1}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={4}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    // Select first domain on page 1
    const checkboxes1 = getAllByRole('checkbox')
    fireEvent.click(checkboxes1[1])
    expect(getByText(/1 selected on this page/i)).toBeInTheDocument()
    // Go to page 2
    rerender(
      <MockedProvider mocks={mocks}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={page2}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={4}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    // Select all on page 2
    const checkboxes2 = getAllByRole('checkbox')
    fireEvent.click(checkboxes2[0]) // select all on page 2
    // Only match the visible banner, not the aria-live region
    const visibleBanner = getAllByText(/All 2 domains on this page are selected/i).find(
      (el) => el.tagName.toLowerCase() === 'p',
    )
    expect(visibleBanner).toBeInTheDocument()
    // Go back to page 1, both selections should persist
    rerender(
      <MockedProvider mocks={mocks}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={page1}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={4}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    // The first domain should still be selected
    expect(getByText(/1 selected on this page/i)).toBeInTheDocument()
  })

  it('shows indeterminate state when some but not all on page are selected', () => {
    const { getAllByRole, getByText } = render(
      <MockedProvider mocks={mocks}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={domains}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={2}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    // Select only one domain
    const checkboxes = getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    // The select all checkbox should be indeterminate
    expect(checkboxes[0].indeterminate).toBe(true)
    expect(getByText(/1 selected on this page/i)).toBeInTheDocument()
  })

  it('select all on page only adds those domains to selection, not clearing others', () => {
    // page 1
    const page1 = [
      { id: '1', domain: 'example.com', tags: ['tag1'] },
      { id: '2', domain: 'test.com', tags: ['tag2'] },
    ]
    // page 2
    const page2 = [
      { id: '3', domain: 'foo.com', tags: ['tag1'] },
      { id: '4', domain: 'bar.com', tags: ['tag2'] },
    ]
    const { getAllByRole, rerender, getByText } = render(
      <MockedProvider mocks={mocks}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={page1}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={4}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    // Select first domain on page 1
    const checkboxes1 = getAllByRole('checkbox')
    fireEvent.click(checkboxes1[1])
    // Go to page 2 and select all
    rerender(
      <MockedProvider mocks={mocks}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={page2}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={4}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    const checkboxes2 = getAllByRole('checkbox')
    fireEvent.click(checkboxes2[0]) // select all on page 2
    // Go back to page 1, both selections should persist
    rerender(
      <MockedProvider mocks={mocks}>
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <DomainUpdateList
              orgId={orgId}
              domains={page1}
              availableTags={availableTags}
              filters={filters}
              search={search}
              domainCount={4}
            />
          </I18nProvider>
        </ChakraProvider>
      </MockedProvider>,
    )
    // Both domains on page 1 should be selectable, and the first should still be selected
    expect(getByText(/1 selected on this page/i)).toBeInTheDocument()
  })
})
