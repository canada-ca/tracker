import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { List, theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

import { AdminDomainCard } from '../AdminDomainCard'
import { MockedProvider } from '@apollo/client/testing'
import { IS_USER_SUPER_ADMIN } from '../../graphql/queries'
import { UserVarProvider } from '../../utilities/userState'
import { makeVar } from '@apollo/client'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const mocks = [
  {
    request: {
      query: IS_USER_SUPER_ADMIN,
    },
    result: {
      data: {
        isUserSuperAdmin: false,
      },
    },
  },
]

describe('<Domain />', () => {
  it('represents a domain', async () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
            insideUser: true,
          })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <List>
                  <AdminDomainCard url="canada.ca" data-testid="domain" />
                </List>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(getByText('canada.ca')).toBeInTheDocument()
    })
  })
})
