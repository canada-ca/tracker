import React from 'react'
import { render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/react-testing'
import { USER_AFFILIATIONS } from '../graphql/queries'
import AdminPage from '../AdminPage'

describe('<AdminPage />', () => {
  const mocks = [
    {
      request: {
        query: USER_AFFILIATIONS,
      },
      result: {
        data: {
          user: [
            {
              affiliations: {
                edges: [
                  {
                    node: {
                      organization: {
                        id: 'YXBwIGFkbWluIHRlc3Q=',
                        acronym: 'ABC',
                      },
                      permission: 'ADMIN',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
  ]

  it('renders correctly', async () => {
    render(
      <I18nProvider i18n={setupI18n()}>
        <ThemeProvider theme={theme}>
          <MockedProvider mocks={mocks} addTypename={false}>
            <AdminPage />
          </MockedProvider>
        </ThemeProvider>
      </I18nProvider>,
    )
  })
})
