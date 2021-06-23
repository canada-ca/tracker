import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { FloatingMenuLink } from '../FloatingMenuLink'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MemoryRouter, Route } from 'react-router-dom'
import { fireEvent } from '@testing-library/dom'
import { MockedProvider } from '@apollo/client/testing'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<FloatingMenuLink>', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <I18nProvider i18n={i18n}>
            <ThemeProvider theme={theme}>
              <FloatingMenuLink to="/sign-in" text="Sign In" />
            </ThemeProvider>
          </I18nProvider>
        </MemoryRouter>
      </MockedProvider>,
    )
    await waitFor(() => expect(getByText(/Sign In/i)).toBeInTheDocument())
  })

  describe('when the link is clicked', () => {
    it('redirects', async () => {
      let wLocation

      const { getByText } = render(
        <MockedProvider>
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ThemeProvider theme={theme}>
                <FloatingMenuLink to="/sign-in" text="Sign In" />
                <Route
                  path="*"
                  render={({ _history, location }) => {
                    wLocation = location
                    return null
                  }}
                />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </MockedProvider>,
      )
      const signInLink = getByText(/Sign In/i)
      fireEvent.click(signInLink)

      await waitFor(() => {
        expect(wLocation.pathname).toBe('/sign-in')
      })
    })
  })
})
