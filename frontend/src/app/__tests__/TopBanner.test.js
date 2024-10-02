import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'

import { TopBanner } from '../TopBanner'

import { UserVarProvider } from '../../utilities/userState'
import { SIGN_OUT } from '../../graphql/mutations'
import { TourProvider } from '../../userOnboarding/contexts/TourContext'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<TopBanner />', () => {
  afterEach(cleanup)

  it('renders text', () => {
    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <MemoryRouter initialEntries={['/']}>
              <I18nProvider i18n={i18n}>
                <TourProvider>
                  <TopBanner />
                </TourProvider>
              </I18nProvider>
            </MemoryRouter>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    expect(getByText('This is a new service, we are constantly improving.'))
  })

  describe('user is logged in', () => {
    describe('on SignOut', () => {
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
              <ChakraProvider theme={theme}>
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <TourProvider>
                      <TopBanner />
                    </TourProvider>
                  </I18nProvider>
                </MemoryRouter>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const signOutBtn = getByText('Sign Out')
        fireEvent.click(signOutBtn)

        await waitFor(() => {
          expect(queryByText('You have successfully been signed out.'))
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
              <ChakraProvider theme={theme}>
                <MemoryRouter initialEntries={['/']}>
                  <I18nProvider i18n={i18n}>
                    <TourProvider>
                      <TopBanner />
                    </TourProvider>
                  </I18nProvider>
                </MemoryRouter>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )
        const signOutBtn = getByText('Sign Out')
        fireEvent.click(signOutBtn)

        await waitFor(() => {
          expect(queryByText('An error occured when you attempted to sign out'))
        })
      })
    })
  })
})
