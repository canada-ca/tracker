import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import {
  PAGINATED_DOMAINS,
  REVERSE_PAGINATED_DOMAINS,
} from '../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { createCache } from '../client'
import { ScanDomain } from '../ScanDomain'
import { REQUEST_SCAN } from '../graphql/mutations'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const fillIn = (element, { with: value }) =>
  fireEvent.change(element, { target: { value } })
const clickOn = (element) => fireEvent.click(element)
const values = { domain: 'cse-cst.gc.ca', scanType: 'WEB' }

describe('<ScanDomain />', () => {
  const mocks = [
    {
      request: {
        query: REQUEST_SCAN,
        variables: {
          domainURL: values.domain,
          scanType: values.scanType,
        },
      },
      result: {
        data: {
          requestScan: {
            status: 'string',
          },
        },
      },
    },
  ]

  describe('given no domain in input', () => {
    it('returns error message', async () => {
      const { getByRole, queryByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <MockedProvider mocks={mocks} cache={createCache()}>
                  <ScanDomain />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      const scanType = getByRole('combobox')
      const submit = getByRole('button')

      fillIn(scanType, {
        with: values.scanType,
      })

      clickOn(submit)

      await waitFor(() => {
        expect(
          queryByText(/Domain url field must not be empty/i),
        ).toBeInTheDocument()
      })
    })
  })

  describe('given a domain as input', () => {
    it('submits a domain for scan', async () => {
      const { container, getByRole, queryByText } = render(
        <UserStateProvider
          initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <MockedProvider mocks={mocks} cache={createCache()}>
                  <ScanDomain />
                </MockedProvider>
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserStateProvider>,
      )

      const domain = container.querySelector('#domain')
      const scanType = getByRole('combobox')
      const submit = getByRole('button')

      fillIn(domain, {
        with: values.domain,
      })

      fillIn(scanType, {
        with: values.scanType,
      })

      clickOn(submit)

      await waitFor(() => {
        expect(
          queryByText(/Domain url field must not be empty/i),
        ).not.toBeInTheDocument()
      })
    })
  })
})
