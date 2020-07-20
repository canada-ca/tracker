import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MockedProvider } from '@apollo/client/testing'
import { DOMAINS, QUERY_USERLIST } from '../graphql/queries'
import AdminPanel from '../AdminPanel'

describe('<AdminPanel />', () => {
  it('renders both a domain list and user list', async () => {
    const mocks = [
      {
        request: {
          query: DOMAINS,
        },
        result: {
          data: {
            domains: {
              edges: [
                {
                  node: {
                    url: 'tbs-sct.gc.ca',
                    slug: 'tbs-sct-gc-ca',
                    lastRan: null,
                  },
                },
                {
                  node: {
                    url: 'canada.ca',
                    slug: 'canada-ca',
                    lastRan: null,
                  },
                },
                {
                  node: {
                    url: 'rcmp-grc.gc.ca',
                    slug: 'rcmp-grc-gc-ca',
                    lastRan: null,
                  },
                },
              ],
              pageInfo: {
                endCursor: 'YXJyYXljb25uZWN0aW9uOjI=',
                hasNextPage: false,
              },
            },
          },
        },
      },
      {
        request: {
          query: QUERY_USERLIST,
          variables: { slug: 'testuser-testemail-gc-ca' },
        },
        result: {
          data: {
            userList: {
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
              },
              edges: [
                {
                  node: {
                    id: 'VXNlckxpc3RJdGVtOigzLCAyKQ==',
                    userName: 'testuser@testemail.gc.ca',
                    admin: true,
                    tfa: false,
                    displayName: 'Test User Esq.',
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
        <I18nProvider i18n={setupI18n()}>
          <ThemeProvider theme={theme}>
            <MockedProvider mocks={mocks} addTypename={false}>
              <AdminPanel orgName="test" />
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
