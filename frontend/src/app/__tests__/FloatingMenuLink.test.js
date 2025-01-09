import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { fireEvent } from '@testing-library/dom'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'

import { FloatingMenuLink } from '../FloatingMenuLink'

import { UserVarProvider } from '../../utilities/userState'

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
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <FloatingMenuLink to="/sign-in" text="Sign In" />
              </ChakraProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => expect(getByText(/Sign In/i)).toBeInTheDocument())
  })

  describe('when the link is clicked', () => {
    it('redirects', async () => {
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
            <I18nProvider i18n={i18n}>
              <ChakraProvider theme={theme}>
                <RouterProvider router={router}>
                  <FloatingMenuLink to="/sign-in" text="Sign In" />
                </RouterProvider>
              </ChakraProvider>
            </I18nProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      const signInLink = getByText(/Sign In/i)
      fireEvent.click(signInLink)

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/sign-in')
      })
    })
  })
})
