import React from 'react'
import { render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import SummaryTable from '../SummaryTable'

describe('<SummaryTable />', () => {
  it('renders correctly', async () => {
    const columns = [{ Header: 'header', accessor: 'accessor' }]
    const data = [{ accessor: 'test' }]
    render(
      <I18nProvider i18n={setupI18n()}>
        <ThemeProvider theme={theme}>
          <SummaryTable data={data} columns={columns} />
        </ThemeProvider>
      </I18nProvider>,
    )
  })
})
