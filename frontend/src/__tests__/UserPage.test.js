import React from 'react'
import { UserPage } from '../UserPage'
import { i18n } from '@lingui/core'
import { render, cleanup, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'

import { QUERY_USER } from '../graphql/queries'
import { UPDATE_PASSWORD } from '../graphql/mutations'

describe('<UserPage />', () => {
  afterEach(cleanup)

  const values = {
    userName: 'testuser@testemail.gc.ca',
  }

  const mocks = [
    {
      request: {
        query: QUERY_USER,
        variables: {
          userName: values.userName,
        },
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

  it('renders without error', () => {
    act(() => {
      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <MemoryRouter initialEntries={['/']}>
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <UserPage />
              </I18nProvider>
            </ThemeProvider>
          </MemoryRouter>
        </MockedProvider>,
      )
    })
  })
})
