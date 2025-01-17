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

// Mock Formik as we're not testing Formik
jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  Formik: ({ children }) => children({ handleChange: jest.fn(), handleSubmit: jest.fn(), values: {}, errors: {} }),
}))

describe('DomainListFilters', () => {
  let setFilters
  let statusOptions
  let filterTagOptions

  beforeEach(() => {
    setFilters = jest.fn()
    statusOptions = [
      { value: 'HTTPS_STATUS', text: `HTTPS Status` },
      { value: 'DMARC_STATUS', text: `DMARC Status` },
    ]
    filterTagOptions = [
      { value: `TAG1`, text: `TAG1` },
      { value: `TAG2`, text: `TAG2` },
    ]
  })

  it('renders correctly', () => {
    const { getByRole } = render(
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
                  statusOptions={statusOptions}
                  filterTagOptions={filterTagOptions}
                />
                ,
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    expect(getByRole('form')).toBeInTheDocument()
  })

  it('updates fields when values are entered', async () => {
    const { getByRole } = render(
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
                  statusOptions={statusOptions}
                  filterTagOptions={filterTagOptions}
                />
                ,
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    const filterCategory = getByRole('combobox', { name: /filterCategory/i })
    const comparison = getByRole('combobox', { name: /comparison/i })
    const filterValue = getByRole('combobox', { name: /filterValue/i })

    await waitFor(() => {
      expect(filterCategory).toBeInTheDocument()
      expect(comparison).toBeInTheDocument()
      expect(filterValue).toBeInTheDocument()
    })

    fireEvent.change(filterCategory, { target: { value: 'HTTPS_STATUS' } })
    fireEvent.change(comparison, { target: { value: 'EQUAL' } })
    fireEvent.change(filterValue, { target: { value: 'PASS' } })

    await waitFor(() => {
      expect(filterCategory.value).toBe('HTTPS_STATUS')
      expect(comparison.value).toBe('EQUAL')
      expect(filterValue.value).toBe('PASS')
    })
  })
})
