import React from 'react'
import { UserPage } from '../UserPage'
import { i18n } from '@lingui/core'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'

import { QUERY_USER } from '../graphql/queries'
import { UPDATE_PASSWORD } from '../graphql/mutations'

describe('<UserPage />', () => {
  afterEach(cleanup)

  it('successfully renders', async () => {
    const { container } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <UserPage />
            </I18nProvider>
          </ThemeProvider>
        </MemoryRouter>
      </MockedProvider>,
    )
    expect(container).toBeDefined()
  })

  it('successfully renders with mock data', async () => {
    const mocks = [
      {
        request: {
          query: QUERY_USER,
        },
        result: {
          user: {
            userName: 'testuser@testemail.gc.ca',
            displayName: 'Test User',
            lang: 'English',
          },
        },
      },
      {
        request: {
          query: UPDATE_PASSWORD,
        },
        result: {
          updatePassword: {
            user: {
              userName: 'Gregg_Grady4@hotmail.com',
            },
          },
        },
      },
    ]

    const { container } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']}>
            <MockedProvider mocks={mocks}>
              <UserPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(container).toBeDefined()
  })
})
