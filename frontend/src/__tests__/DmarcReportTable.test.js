import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import DmarcReportTable from '../DmarcReportTable'
import {
  singleDmarcReportDetailTableData,
  singleDmarcReportDetailTableColumns,
} from './fixtures/dmarcReportDetailTablesData'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<DmarcReportTable />', () => {
  it('renders correctly', async () => {
    const { getAllByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <div>
            <DmarcReportTable
              data={singleDmarcReportDetailTableData}
              columns={singleDmarcReportDetailTableColumns}
              title="Fully Aligned by IP Address"
              initialSort={[{ id: 'totalMessages', desc: true }]}
            />
          </div>
        </I18nProvider>
      </ThemeProvider>,
    )
    await waitFor(() => getAllByText(/Fully Aligned by IP Address/i))
  })
})
