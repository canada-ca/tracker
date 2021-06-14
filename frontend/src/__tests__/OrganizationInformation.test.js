import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import OrganizationInformation from '../OrganizationInformation'
import { SIGN_UP } from '../graphql/mutations'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserStateProvider } from '../UserState'

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
      query: SIGN_UP,
    },
    result: {
      data: {
        user: {
          userName: 'foo@example.com',
        },
      },
    },
  },
]

describe('<OrganizationInformation />', () => {
  describe('given a valid organization slug', () => {
    describe('the organization has the required fields', () => {
      it('displays the organization information', async () => {
        const { container, queryByText } = render(
          <MockedProvider mocks={mocks}>
            <UserStateProvider
              initialState={{ userName: null, jwt: null, tfaSendMethod: null }}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <OrganizationInformation orgSlug="test-org" />
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserStateProvider>
          </MockedProvider>,
        )
      })
    })
  })
})
