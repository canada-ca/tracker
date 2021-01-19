import React from 'react'
import UserPage from '../UserPage'
import { setupI18n } from '@lingui/core'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { UserStateProvider } from '../UserState'
import { QUERY_CURRENT_USER } from '../graphql/queries'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<UserPage />', () => {
  const userName = 'testuser@testemail.gc.ca'

  const mocks = [
    {
      request: {
        query: QUERY_CURRENT_USER,
      },
      result: {
        data: {
          userPage: {
            id: 'ODk3MDg5MzI2MA==',
            userName: userName,
            displayName: 'Test User',
            preferredLang: 'ENGLISH',
            phoneNumber: '19025551234',
            tfaSendMethod: 'PHONE',
            phoneValidated: true,
            emailValidated: true,
          },
        },
      },
    },
  ]

  it('renders without error', async () => {
    const { queryByText } = render(
      <UserStateProvider
        initialState={{ userName, jwt: 'string', tfaSendMethod: null }}
      >
        <MockedProvider mocks={mocks} addTypename={false}>
          <MemoryRouter initialEntries={['/']}>
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <UserPage />
              </I18nProvider>
            </ThemeProvider>
          </MemoryRouter>
        </MockedProvider>
      </UserStateProvider>,
    )
    await waitFor(() => expect(queryByText(userName)).toBeInTheDocument())
  })
})
