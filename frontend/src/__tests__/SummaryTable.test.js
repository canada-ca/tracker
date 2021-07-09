import React from 'react'
import { render } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import SummaryTable from '../SummaryTable'

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

describe('<SummaryTable />', () => {
  it('renders correctly', async () => {
    const columns = [{ Header: 'header', accessor: 'accessor' }]
    const data = [{ accessor: 'test' }]
    render(
      <I18nProvider i18n={i18n}>
        <ChakraProvider theme={theme}>
          <SummaryTable data={data} columns={columns} />
        </ChakraProvider>
      </I18nProvider>,
    )
  })
})
