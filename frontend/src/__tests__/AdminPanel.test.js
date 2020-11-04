import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MockedProvider } from '@apollo/client/testing'
import { ADMIN_PANEL } from '../graphql/queries'
import AdminPanel from '../AdminPanel'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<AdminPanel />', () => {
  it('renders both a domain list and user list', async () => {
    const mocks = [
      {
        request: {
          query: ADMIN_PANEL,
          variables: { slug: 'testorgslug' },
        },
        result: {
          data: {
            domains: {
              edges: [
                {
                  node: {
                    url: 'tbs-sct.ca',
                    slug: 'tbs-sct-ca',
                    lastRan: null,
                  },
                },
              ],
              pageInfo: {
                endCursor: 'YXJyYXljb25uZWN0aW9uOjQ=',
                hasNextPage: false,
              },
            },
            userList: {
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
              },
              edges: [
                {
                  node: {
                    id: 'VXNlckxpc3RJdGVtOig0LCAzKQ==',
                    userName: 'testuser@testemail.gc.ca',
                    role: 'ADMIN',
                    tfa: false,
                    displayName: 'testuser',
                  },
                },
              ],
            },
          },
        },
      },
    ]

    const { getByText } = render(
      <UserStateProvider
        initialState={{
          userName: 'testuser@testemail.gc.ca',
          jwt: 'string',
          tfa: false,
        }}
      >
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <AdminPanel orgName="testorgslug" />
            </MockedProvider>
          </ThemeProvider>
        </I18nProvider>
      </UserStateProvider>,
    )
    await waitFor(() => {
      expect(getByText('Domain List')).toBeInTheDocument()
      expect(getByText('User List')).toBeInTheDocument()
    })
  })
})
