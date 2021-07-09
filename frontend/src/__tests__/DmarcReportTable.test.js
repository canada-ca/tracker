import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import DmarcReportTable from '../DmarcReportTable'
import {
  singleDmarcReportDetailTableColumns,
  singleDmarcReportDetailTableData,
} from '../fixtures/dmarcReportDetailTablesData'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

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
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <div>
            <DmarcReportTable
              data={singleDmarcReportDetailTableData}
              columns={singleDmarcReportDetailTableColumns}
              title="Fully Aligned by IP Address"
              initialSort={[{ id: 'totalMessages', desc: true }]}
            />
          </div>
        </I18nProvider>
      </ChakraProvider>,
    )
    await waitFor(() => getAllByText(/Fully Aligned by IP Address/i))
  })
})
