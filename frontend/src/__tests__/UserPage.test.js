import React from 'react'
import { UserPage } from '../UserPage'
import { i18n } from '@lingui/core'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/react-testing'
import { UserStateProvider } from '../UserState'
import { QUERY_USER } from '../graphql/queries'
import { en } from 'make-plural'

i18n.loadLocaleData('en', { plurals: en })
i18n.load('en', { en: {} })
i18n.activate('en')

describe('<UserPage />', () => {
  const userName = 'testuser@testemail.gc.ca'

  const mocks = [
    {
      request: {
        query: QUERY_USER,
        variables: { userName },
      },
      result: {
        data: {
          userPage: {
            userName: userName,
            tfa: false,
            lang: 'English',
            displayName: 'testUser',
            userAffiliations: [
              {
                admin: false,
                organization: 'ASDF',
              },
              {
                admin: false,
                organization: 'GC',
              },
              {
                admin: false,
                organization: 'ABC',
              },
            ],
          },
        },
      },
    },
  ]

  it('renders without error', async () => {
    const { getByDisplayValue } = render(
      <UserStateProvider initialState={{ userName, jwt: 'string', tfa: false }}>
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

    const updateUserNameInput = await waitFor(() => getByDisplayValue(userName))

    expect(updateUserNameInput.type).toEqual('email')
  })
})
