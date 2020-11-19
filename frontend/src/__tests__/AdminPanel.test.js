import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MockedProvider } from '@apollo/client/testing'
import { ADMIN_PANEL } from '../graphql/queries'
import AdminPanel from '../AdminPanel'
import { rawAdminPanelData } from '../fixtures/adminPanelData'
import { MemoryRouter, Route } from 'react-router-dom'

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
          variables: { orgSlug: 'test-org' },
        },
        result: rawAdminPanelData,
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
            <MemoryRouter initialEntries={['/admin']} initialIndex={0}>
              <Route path="/admin">
                <MockedProvider mocks={mocks} addTypename={false}>
                  <AdminPanel orgSlug="test-org" permission="ADMIN" />
                </MockedProvider>
              </Route>
            </MemoryRouter>
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
