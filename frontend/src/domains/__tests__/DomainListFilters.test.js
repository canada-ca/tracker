import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { DomainListFilters } from '../DomainListFilters'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { UserVarProvider } from '../../utilities/userState'
import { makeVar } from '@apollo/client'
import { createCache } from '../../client'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { en } from 'make-plural/plurals'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('DomainListFilters', () => {
  let setFilters
  let resetToFirstPage
  let statusOptions
  let filterTagOptions
  let assetStateOptions
  let guidanceTagOptions

  beforeEach(() => {
    setFilters = jest.fn()
    resetToFirstPage = jest.fn()
    statusOptions = [
      { value: 'HTTPS_STATUS', text: `HTTPS Status` },
      { value: 'DMARC_STATUS', text: `DMARC Status` },
    ]
    filterTagOptions = [
      { value: `TAG1`, text: `TAG1` },
      { value: `TAG2`, text: `TAG2` },
    ]
    assetStateOptions = [
      { value: 'ACTIVE', text: 'Active' },
      { value: 'INACTIVE', text: 'Inactive' },
    ]
    guidanceTagOptions = [
      { value: 'NEGATIVE', text: 'Negative' },
      { value: 'POSITIVE', text: 'Positive' },
    ]
  })

  function renderFilters(props = {}) {
    return render(
      <MockedProvider mocks={[]} cache={createCache()}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <DomainListFilters
                  filters={[]}
                  setFilters={setFilters}
                  resetToFirstPage={resetToFirstPage}
                  statusOptions={statusOptions}
                  filterTagOptions={filterTagOptions}
                  assetStateOptions={assetStateOptions}
                  guidanceTagOptions={guidanceTagOptions}
                  {...props}
                />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
  }

  it('renders correctly', () => {
    const { getByRole } = renderFilters()
    expect(getByRole('form')).toBeInTheDocument()
  })

  it('updates fields when values are entered', async () => {
    const { getByRole } = renderFilters()
    const filterCategory = getByRole('combobox', { name: /filterCategory/i })
    const statusOption = getByRole('combobox', { name: /statusOption/i })
    const comparison = getByRole('combobox', { name: /comparison/i })
    const filterValue = getByRole('combobox', { name: /filterValue/i })

    await waitFor(() => {
      expect(filterCategory).toBeInTheDocument()
      expect(filterCategory.value).toBe('STATUS')
      expect(statusOption).toBeInTheDocument()
      expect(comparison).toBeInTheDocument()
      expect(filterValue).toBeInTheDocument()
    })

    fireEvent.change(statusOption, { target: { value: 'HTTPS_STATUS' } })
    fireEvent.change(comparison, { target: { value: 'EQUAL' } })
    fireEvent.change(filterValue, { target: { value: 'PASS' } })

    await waitFor(() => {
      expect(statusOption.value).toBe('HTTPS_STATUS')
      expect(comparison.value).toBe('EQUAL')
      expect(filterValue.value).toBe('PASS')
    })
  })

  it('renders TAGS filter options when selected', async () => {
    const { getByRole } = renderFilters()
    const filterCategory = getByRole('combobox', { name: /filterCategory/i })
    fireEvent.change(filterCategory, { target: { value: 'TAGS' } })
    await waitFor(() => {
      const filterValue = getByRole('combobox', { name: /filterValue/i })
      expect(filterValue).toBeInTheDocument()
      const optionValues = Array.from(filterValue.options).map((opt) => opt.textContent)
      expect(optionValues).toContain('TAG1')
      expect(optionValues).toContain('TAG2')
    })
  })

  it('renders DMARC_PHASE filter options when selected', async () => {
    const { getByRole } = renderFilters()
    const filterCategory = getByRole('combobox', { name: /filterCategory/i })
    fireEvent.change(filterCategory, { target: { value: 'DMARC_PHASE' } })
    await waitFor(() => {
      const filterValue = getByRole('combobox', { name: /filterValue/i })
      expect(filterValue).toBeInTheDocument()
      const optionValues = Array.from(filterValue.options).map((opt) => opt.textContent)
      expect(optionValues).toContain('Assess')
      expect(optionValues).toContain('Deploy')
      expect(optionValues).toContain('Enforce')
      expect(optionValues).toContain('Maintain')
    })
  })

  it('renders ASSET_STATE filter options when selected', async () => {
    const { getByRole } = renderFilters()
    const filterCategory = getByRole('combobox', { name: /filterCategory/i })
    fireEvent.change(filterCategory, { target: { value: 'ASSET_STATE' } })
    await waitFor(() => {
      const filterValue = getByRole('combobox', { name: /filterValue/i })
      expect(filterValue).toBeInTheDocument()
      const optionValues = Array.from(filterValue.options).map((opt) => opt.textContent)
      expect(optionValues).toContain('Active')
      expect(optionValues).toContain('Inactive')
    })
  })

  it('renders GUIDANCE_TAG filter options when selected', async () => {
    const { getByRole } = renderFilters()
    const filterCategory = getByRole('combobox', { name: /filterCategory/i })
    fireEvent.change(filterCategory, { target: { value: 'GUIDANCE_TAG' } })
    await waitFor(() => {
      const filterValue = getByRole('combobox', { name: /filterValue/i })
      expect(filterValue).toBeInTheDocument()
      const optionValues = Array.from(filterValue.options).map((opt) => opt.textContent)
      expect(optionValues).toContain('Negative')
      expect(optionValues).toContain('Positive')
    })
  })

  it('shows validation errors when submitting empty form', async () => {
    const { getByRole, findAllByText } = renderFilters()
    const submitBtn = getByRole('button', { name: /apply/i })
    fireEvent.click(submitBtn)
    // The error message is "This field cannot be empty"
    const errors = await findAllByText(/cannot be empty/i)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('calls setFilters and resetToFirstPage on submit', async () => {
    const { getByRole } = renderFilters()
    fireEvent.change(getByRole('combobox', { name: /statusOption/i }), { target: { value: 'HTTPS_STATUS' } })
    fireEvent.change(getByRole('combobox', { name: /comparison/i }), { target: { value: 'EQUAL' } })
    fireEvent.change(getByRole('combobox', { name: /filterValue/i }), { target: { value: 'PASS' } })
    fireEvent.click(getByRole('button', { name: /apply/i }))
    await waitFor(() => {
      expect(setFilters).toHaveBeenCalled()
      expect(resetToFirstPage).toHaveBeenCalled()
    })
  })

  it('resets dependent fields when filterCategory changes', async () => {
    const { getByRole } = renderFilters()
    const filterCategory = getByRole('combobox', { name: /filterCategory/i })
    fireEvent.change(filterCategory, { target: { value: 'STATUS' } })
    const statusOption = getByRole('combobox', { name: /statusOption/i })
    fireEvent.change(statusOption, { target: { value: 'HTTPS_STATUS' } })
    // Change to TAGS, which should reset statusOption
    fireEvent.change(filterCategory, { target: { value: 'TAGS' } })
    await waitFor(() => {
      // statusOption should not be in the DOM anymore
      expect(() => getByRole('combobox', { name: /statusOption/i })).toThrow()
    })
  })
})
