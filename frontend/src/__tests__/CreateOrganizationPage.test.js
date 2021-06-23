import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import CreateOrganizationPage from '../CreateOrganizationPage'
import { CREATE_ORGANIZATION } from '../graphql/mutations'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

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
      query: CREATE_ORGANIZATION,
    },
    result: {
      data: {
        organization: {
          name: 'New Test Org',
        },
      },
    },
  },
]

describe('<CreateOrganizationPage />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks}>
        <ThemeProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/']} initialIndex={0}>
              <CreateOrganizationPage />
            </MemoryRouter>
          </I18nProvider>
        </ThemeProvider>
      </MockedProvider>,
    )

    const welcomeMessage = /Create an organization by filling out the following info in both English and French/i

    await waitFor(() => expect(getByText(welcomeMessage)).toBeInTheDocument())
  })

  describe('acronym fields', () => {
    it('displays an error message when incorrect format is used', async () => {
      const { container, getByText } = render(
        <MockedProvider mocks={mocks}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <CreateOrganizationPage />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </MockedProvider>,
      )

      const acronymEN = container.querySelector('#acronymEN')
      const errorMessage = /Acronyms can only use upper case letters and underscores/i

      await waitFor(() => {
        fireEvent.change(acronymEN, { target: { value: 'test' } })
      })

      await waitFor(() => {
        fireEvent.blur(acronymEN)
      })

      await waitFor(() => expect(getByText(errorMessage)).toBeInTheDocument())
    })

    it('displays an error message when input is too large', async () => {
      const { container, getByText } = render(
        <MockedProvider mocks={mocks}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <CreateOrganizationPage />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </MockedProvider>,
      )

      const acronymEN = container.querySelector('#acronymEN')
      const errorMessage = /Acronyms must be at most 50 characters/i

      await waitFor(() => {
        fireEvent.change(acronymEN, {
          target: {
            value:
              'THIS_ACRONYM_IS_OVER_FIFTY_CHARACTERS_WHICH_MAKES_IT_INVALID',
          },
        })
      })

      await waitFor(() => {
        fireEvent.blur(acronymEN)
      })

      await waitFor(() => expect(getByText(errorMessage)).toBeInTheDocument())
    })
  })
})
