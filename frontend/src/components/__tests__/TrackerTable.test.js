import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural/plurals'

import { TrackerTable } from '../TrackerTable'

import {
  rawDmarcReportSummaryTableColumns,
  rawDmarcReportSummaryTableData,
} from '../../fixtures/dmarcReportSummaryTable'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<TrackerTable />', () => {
  it('renders table correctly', async () => {
    const { getAllByText } = render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <TrackerTable
            data={rawDmarcReportSummaryTableData}
            columns={rawDmarcReportSummaryTableColumns}
            title="TestTitle"
            initialSort={[{ id: 'totalMessages', desc: true }]}
          />
        </I18nProvider>
      </ChakraProvider>,
    )
    await waitFor(() => getAllByText(/Fully Aligned by IP Address/i))
  })

  describe('pagination controls', () => {
    it('can go to next page', async () => {
      const { getByLabelText, queryByText } = render(
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TrackerTable
              data={rawDmarcReportSummaryTableData}
              columns={rawDmarcReportSummaryTableColumns}
              title="TestTitle"
              initialSort={[{ id: 'totalMessages', desc: true }]}
            />
          </I18nProvider>
        </ChakraProvider>,
      )
      await waitFor(() => {
        expect(queryByText(/last-domain.info/)).not.toBeInTheDocument()
      })
      // click next page button
      await waitFor(() => {
        const nextPage = getByLabelText(/Go to next page/)
        fireEvent.click(nextPage)
      })
      // expect last domain
      await waitFor(() => {
        expect(queryByText(/last-domain.info/)).toBeInTheDocument()
      })
    })

    it('can use input field', async () => {
      const { getByLabelText, queryByText } = render(
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TrackerTable
              data={rawDmarcReportSummaryTableData}
              columns={rawDmarcReportSummaryTableColumns}
              title="TestTitle"
              initialSort={[{ id: 'totalMessages', desc: true }]}
            />
          </I18nProvider>
        </ChakraProvider>,
      )
      await waitFor(() => {
        expect(queryByText(/last-domain.info/)).not.toBeInTheDocument()
      })
      const input = getByLabelText(/Go to input page/)
      // input new number
      await waitFor(() => {
        expect(input.value).toBe('1')
        fireEvent.change(input, { target: { value: 2 } })
      })
      // expect the input to have changed
      await waitFor(() => {
        expect(input.value).toBe('2')
      })
      // expect last domain
      await waitFor(() => {
        expect(queryByText(/last-domain.info/)).toBeInTheDocument()
      })
    })
    it('increases items per page', async () => {
      const { getByLabelText, queryByText } = render(
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TrackerTable
              data={rawDmarcReportSummaryTableData}
              columns={rawDmarcReportSummaryTableColumns}
              title="TestTitle"
              initialSort={[{ id: 'totalMessages', desc: true }]}
            />
          </I18nProvider>
        </ChakraProvider>,
      )
      await waitFor(() => {
        expect(queryByText(/last-domain.info/)).not.toBeInTheDocument()
      })
      await waitFor(() => {
        const itemsPerPage = getByLabelText('Items per page')
        fireEvent.change(itemsPerPage, { target: { value: 20 } })
      })
      await waitFor(() => {
        expect(queryByText(/last-domain.info/)).toBeInTheDocument()
      })
    })
  })
})
