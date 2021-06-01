import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
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
const values = { domain: 'cse-cst.gc.ca' }

describe('<ScanDomain />', () => {
  const mocks = [
    {
      request: {
        query: REQUEST_SCAN,
        variables: {
          domainUrl: values.domain,
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
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                  <ScanDomain />
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>
        </MockedProvider>,
      )

      const submit = getByRole('button')
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
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                  <ScanDomain />
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>
        </MockedProvider>,
      )

      const domain = container.querySelector('#domain')
      const submit = getByRole('button')

      fillIn(domain, {
        with: values.domain,
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
