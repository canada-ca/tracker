import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural/plurals'
import TrackerTable from '../TrackerTable'
import { rawDmarcReportSummaryTableColumns } from '../fixtures/dmarcReportSummaryTable'
import userEvent from '@testing-library/user-event'

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

const tableData = [
  {
    domain: 'erna.org',
    __typename: 'CategoryPercentages',
    failPercentage: 7,
    fullPassPercentage: 76,
    passDkimOnlyPercentage: 14,
    passSpfOnlyPercentage: 3,
    totalMessages: 9501,
  },
  {
    domain: 'chyna.com',
    __typename: 'CategoryPercentages',
    failPercentage: 16,
    fullPassPercentage: 19,
    passDkimOnlyPercentage: 51,
    passSpfOnlyPercentage: 14,
    totalMessages: 7162,
  },
  {
    domain: 'weston.org',
    __typename: 'CategoryPercentages',
    failPercentage: 6,
    fullPassPercentage: 43,
    passDkimOnlyPercentage: 28,
    passSpfOnlyPercentage: 23,
    totalMessages: 12477,
  },
  {
    domain: 'kristina.org',
    __typename: 'CategoryPercentages',
    failPercentage: 0,
    fullPassPercentage: 89,
    passDkimOnlyPercentage: 8,
    passSpfOnlyPercentage: 3,
    totalMessages: 1596,
  },
  {
    domain: 'antonetta.net',
    __typename: 'CategoryPercentages',
    failPercentage: 7,
    fullPassPercentage: 18,
    passDkimOnlyPercentage: 0,
    passSpfOnlyPercentage: 75,
    totalMessages: 14086,
  },
  {
    domain: 'davonte.biz',
    __typename: 'CategoryPercentages',
    failPercentage: 5,
    fullPassPercentage: 74,
    passDkimOnlyPercentage: 4,
    passSpfOnlyPercentage: 17,
    totalMessages: 2464,
  },
  {
    domain: 'jasper.info',
    __typename: 'CategoryPercentages',
    failPercentage: 3,
    fullPassPercentage: 75,
    passDkimOnlyPercentage: 14,
    passSpfOnlyPercentage: 8,
    totalMessages: 4623,
  },
  {
    domain: 'audie.net',
    __typename: 'CategoryPercentages',
    failPercentage: 14,
    fullPassPercentage: 72,
    passDkimOnlyPercentage: 7,
    passSpfOnlyPercentage: 7,
    totalMessages: 9028,
  },
  {
    domain: 'hettie.info',
    __typename: 'CategoryPercentages',
    failPercentage: 2,
    fullPassPercentage: 27,
    passDkimOnlyPercentage: 66,
    passSpfOnlyPercentage: 5,
    totalMessages: 13872,
  },
  {
    domain: 'dorothy.biz',
    __typename: 'CategoryPercentages',
    failPercentage: 1,
    fullPassPercentage: 88,
    passDkimOnlyPercentage: 10,
    passSpfOnlyPercentage: 1,
    totalMessages: 2767,
  },
  {
    domain: 'zero.messages.domain',
    __typename: 'CategoryPercentages',
    failPercentage: 0,
    fullPassPercentage: 0,
    passDkimOnlyPercentage: 0,
    passSpfOnlyPercentage: 0,
    totalMessages: 0,
  },
]

describe('<TrackerTable />', () => {
  it('renders table correctly', async () => {
    const { getAllByText } = render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <TrackerTable
            data={tableData}
            columns={rawDmarcReportSummaryTableColumns}
            title="TestTitle"
            initialSort={[{ id: 'totalMessages', desc: true }]}
          />
        </I18nProvider>
      </ChakraProvider>,
    )
    await waitFor(() => getAllByText(/Fully Aligned by IP Address/i))
    await waitFor(() => getAllByText(/erna.org/i))
  })

  describe('pagination controls', () => {
    it('can go to next page', async () => {
      const { queryByText, getByRole } = render(
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TrackerTable
              data={tableData}
              columns={rawDmarcReportSummaryTableColumns}
              title="TestTitle"
              initialSort={[{ id: 'totalMessages', desc: true }]}
            />
          </I18nProvider>
        </ChakraProvider>,
      )
      expect(queryByText('erna.org')).toBeInTheDocument()
      expect(queryByText('zero.messages.domain')).not.toBeInTheDocument()

      const nextPageButton = getByRole('button', { name: /Go to next page/i })
      userEvent.click(nextPageButton)

      expect(queryByText('erna.org')).not.toBeInTheDocument()
      expect(queryByText('zero.messages.domain')).toBeInTheDocument()
    })

    it('can use input field to change pages', async () => {
      const { queryByText, getByRole } = render(
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TrackerTable
              data={tableData}
              columns={rawDmarcReportSummaryTableColumns}
              title="TestTitle"
              initialSort={[{ id: 'totalMessages', desc: true }]}
            />
          </I18nProvider>
        </ChakraProvider>,
      )
      expect(queryByText('erna.org')).toBeInTheDocument()
      expect(queryByText('zero.messages.domain')).not.toBeInTheDocument()

      // change to page 2
      const changePageInput = getByRole('spinbutton', {
        name: /Go to page:/i,
      })
      userEvent.clear(changePageInput)
      userEvent.type(changePageInput, '2')

      expect(queryByText('erna.org')).not.toBeInTheDocument()
      expect(queryByText('zero.messages.domain')).toBeInTheDocument()
    })

    it('increases items per page', async () => {
      const { queryByText, getByRole } = render(
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <TrackerTable
              data={tableData}
              columns={rawDmarcReportSummaryTableColumns}
              title="TestTitle"
              initialSort={[{ id: 'totalMessages', desc: true }]}
            />
          </I18nProvider>
        </ChakraProvider>,
      )
      expect(queryByText('erna.org')).toBeInTheDocument()
      expect(queryByText('zero.messages.domain')).not.toBeInTheDocument()

      const changePageSizeSelect = getByRole('combobox', {
        name: /Items per page:/i,
      })
      userEvent.selectOptions(changePageSizeSelect, 'Show 20')

      expect(queryByText('erna.org')).toBeInTheDocument()
      expect(queryByText('zero.messages.domain')).toBeInTheDocument()
    })
  })
})
