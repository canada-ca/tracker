import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import matchMediaPolyfill from 'mq-polyfill'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import MyTrackerPage from '../MyTrackerPage'

import { UserVarProvider } from '../../utilities/userState'
import { MY_TRACKER_SUMMARY } from '../../graphql/queries'
import { TourProvider } from '../../userOnboarding/contexts/TourContext'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

matchMediaPolyfill(window)

window
  .matchMedia('(min-width: 920px)') // Create MediaQueryList instance
  .addListener(console.log) // Subscribe to MQ mode changes

/**
 * For dispatching resize event
 * we must implement window.resizeTo in jsdom
 */
window.resizeTo = function resizeTo(width, height) {
  Object.assign(this, {
    innerWidth: width,
    innerHeight: height,
    outerWidth: width,
    outerHeight: height,
  }).dispatchEvent(new this.Event('resize'))
}

describe('<MyTrackerPage />', () => {
  describe('', () => {
    it('', async () => {
      window.resizeTo(1024, 768)

      const mocks = [
        {
          request: {
            query: MY_TRACKER_SUMMARY,
          },
          result: {
            data: {
              findMyTracker: {
                domainCount: 1,
                summaries: {
                  https: {
                    total: 54386,
                    categories: [
                      {
                        name: 'pass',
                        count: 7435,
                        percentage: 50,
                      },
                      {
                        name: 'fail',
                        count: 7435,
                        percentage: 43.5,
                      },
                    ],
                  },
                  dmarcPhase: {
                    total: 5355,
                    categories: [
                      {
                        name: 'not implemented',
                        count: 611,
                        percentage: 11.409897292250234,
                      },
                      {
                        name: 'assess',
                        count: 410,
                        percentage: 7.65639589169001,
                      },
                      {
                        name: 'deploy',
                        count: 1751,
                        percentage: 32.698412698412696,
                      },
                      {
                        name: 'enforce',
                        count: 1248,
                        percentage: 23.30532212885154,
                      },
                      {
                        name: 'maintain',
                        count: 1335,
                        percentage: 24.92997198879552,
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ]

      const { getByText, getByRole } = render(
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <UserVarProvider
                userVar={makeVar({
                  jwt: null,
                  tfaSendMethod: null,
                  userName: null,
                })}
              >
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <TourProvider>
                    <MyTrackerPage />
                  </TourProvider>
                </MemoryRouter>
              </UserVarProvider>
            </MockedProvider>
          </I18nProvider>
        </ChakraProvider>,
      )

      await waitFor(() => {
        expect(getByRole('tab', { name: 'Summary' })).toBeInTheDocument()
      })

      const domainsTab = getByRole('tab', { name: 'Domains' })
      fireEvent.click(domainsTab)
      await waitFor(() => {
        expect(getByText(/Search:/i)).toBeInTheDocument()
      })
    })
  })
})
