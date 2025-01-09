import React from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { fireEvent } from '@testing-library/dom'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'

import { FloatingMenu } from '../FloatingMenu'

import { UserVarProvider } from '../../utilities/userState'
import { SIGN_OUT } from '../../graphql/mutations'

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
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
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
      it.skip('closes the menu', async () => {
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
        const router = createMemoryRouter(
          [
            {
              path: '/sign-in',
              element: <div>Sign in</div>,
            },
            {
              path: '*',
              element: <div></div>,
            },
          ],
          {
            initialEntries: ['/'],
            initialIndex: 0,
          },
        )

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
                    <RouterProvider router={router}>
                      <FloatingMenu />
                    </RouterProvider>
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
          expect(router.state.location.pathname).toBe('/sign-in')
        })
      })
    })
    describe('when user is logged in', () => {
      describe('when the Sign Out button is clicked', () => {
        afterEach(cleanup)
        it('succeeds', async () => {
          const mocks = [
            {
              request: {
                query: SIGN_OUT,
              },
              result: {
                data: {
                  signOut: {
                    status: 'wfewgwgew',
                  },
                },
              },
            },
          ]

          const { queryByText, getByText } = render(
            <MockedProvider mocks={mocks} addTypename={false}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: 'fwgegvgerdf',
                  tfaSendMethod: 'none',
                  userName: 'user@test.ca',
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
            expect(queryByText(/Sign Out/i)).toBeInTheDocument()
          })

          const signOutButton = getByText(/Sign Out/i)
          fireEvent.click(signOutButton)

          await waitFor(() => {
            expect(queryByText(/You have successfully been signed out./i))
          })
        })
        it('fails', async () => {
          const mocks = [
            {
              request: {
                query: SIGN_OUT,
              },
              result: {
                error: {
                  errors: [{ message: 'foobar' }],
                },
              },
            },
          ]

          const { queryByText, getByText } = render(
            <MockedProvider mocks={mocks} addTypename={false}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: 'fwgegvgerdf',
                  tfaSendMethod: 'none',
                  userName: 'user@test.ca',
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
            expect(queryByText('Sign Out')).toBeInTheDocument()
          })

          const signOutButton = getByText('Sign Out')
          fireEvent.click(signOutButton)

          await waitFor(() => {
            expect(queryByText(/An error occured when you attempted to sign out/i))
          })
        })
      })
    })
  })
})
