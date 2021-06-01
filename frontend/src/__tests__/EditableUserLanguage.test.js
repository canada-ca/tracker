import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import EditableUserLanguage from '../EditableUserLanguage'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<EditableUserLanguage />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider addTypename={false}>
        <UserStateProvider
          initialState={{
            userName: 'testUserName@email.com',
            jwt: 'string',
            tfaSendMethod: false,
          }}
        >
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <ThemeProvider theme={theme}>
                <EditableUserLanguage />
              </ThemeProvider>
            </I18nProvider>
          </MemoryRouter>
        </UserStateProvider>
      </MockedProvider>,
    )
    await waitFor(() => expect(getByText(/Save Language/i)).toBeInTheDocument())
  })
})
