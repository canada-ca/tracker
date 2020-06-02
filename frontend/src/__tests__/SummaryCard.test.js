import React from 'react'
import { render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { SummaryCard } from '../SummaryCard'

describe('<SummaryCard />', () => {
  it('renders correctly', async () => {
    render(
      <I18nProvider i18n={setupI18n()}>
        <ThemeProvider theme={theme}>
          <SummaryCard title="title" description="description" />
        </ThemeProvider>
      </I18nProvider>,
    )
  })
})
