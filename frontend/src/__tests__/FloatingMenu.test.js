import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MemoryRouter, Route } from 'react-router-dom'
import { fireEvent } from '@testing-library/dom'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'

import { FloatingMenu } from '../app/FloatingMenu'
import { UserVarProvider } from '../utilities/userState'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<FloatingMenu>', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <FloatingMenu />
              </ChakraProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => expect(getByText(/Menu/i)).toBeInTheDocument())
  })
  describe("when the 'Menu' button is clicked", () => {
    it('opens the menu', async () => {
      const { getByText } = render(
        <MockedProvider>
          <UserVarProvider
            userVar={makeVar({
              jwt: null,
              tfaSendMethod: null,
              userName: null,
            })}
          >
            <MemoryRouter initialEntries={['/']}>
              <I18nProvider i18n={i18n}>
                <ChakraProvider theme={theme}>
                  <FloatingMenu />
                </ChakraProvider>
              </I18nProvider>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>,
      )
      const menuButton = getByText(/Menu/i)
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(getByText(/Sign In/i)).toBeInTheDocument()
      })
    })
  })
  describe('when the menu is open', () => {
    describe("and the 'Close' button is clicked", () => {
      it('closes the menu', async () => {
        const { getByText, queryByText } = render(
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <MemoryRouter initialEntries={['/']}>
                <I18nProvider i18n={i18n}>
                  <ChakraProvider theme={theme}>
                    <FloatingMenu />
                  </ChakraProvider>
                </I18nProvider>
              </MemoryRouter>
            </UserVarProvider>
          </MockedProvider>,
        )
        const menuButton = getByText(/Menu/i)
        fireEvent.click(menuButton)

        await waitFor(() => {
          expect(getByText(/Close/i)).toBeInTheDocument()
        })

        const closeButton = getByText(/Close/i)

        fireEvent.click(closeButton)

        await waitFor(() => {
          expect(queryByText(/Close/i)).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('when the menu is open', () => {
    describe("and the 'Sign In' button is clicked", () => {
      it('redirects to the sign in page', async () => {
        let wLocation

        const { getByText } = render(
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                jwt: null,
                tfaSendMethod: null,
                userName: null,
              })}
            >
              <MemoryRouter initialEntries={['/']}>
                <I18nProvider i18n={i18n}>
                  <ChakraProvider theme={theme}>
                    <FloatingMenu />
                    <Route
                      path="*"
                      render={({ _history, location }) => {
                        wLocation = location
                        return null
                      }}
                    />
                  </ChakraProvider>
                </I18nProvider>
              </MemoryRouter>
            </UserVarProvider>
          </MockedProvider>,
        )
        const menuButton = getByText(/Menu/i)
        fireEvent.click(menuButton)

        await waitFor(() => {
          expect(getByText(/Sign In/i)).toBeInTheDocument()
        })

        const signInButton = getByText(/Sign In/i)
        fireEvent.click(signInButton)

        await waitFor(() => {
          expect(wLocation.pathname).toBe('/sign-in')
        })
      })
    })
  })
})
