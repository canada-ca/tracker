import React from 'react'
import { render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import AdminPage from '../AdminPage'

describe('<AdminPage />', () => {
  const mocks = [
    {
      node: {
        organization: {
          id: 'YWRtaW5wYWdldGVzdA==',
          acronym: 'GC',
        },
        permission: 'ADMIN',
      },
    },
  ]

  it('renders correctly', async () => {
    render(
      <I18nProvider i18n={setupI18n()}>
        <ThemeProvider theme={theme}>
          <AdminPage orgs={mocks} />
        </ThemeProvider>
      </I18nProvider>,
    )
  })
})
