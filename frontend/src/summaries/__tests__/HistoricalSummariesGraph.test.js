import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { render } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

import { historicalSummariesData } from '../../fixtures/summaryListData'
import { HistoricalSummariesGraph } from '../HistoricalSummariesGraph'
import { MemoryRouter } from 'react-router-dom'

// ** need to mock the ResizeObserver and polute the window object to avoid errors
class ResizeObserver {
  observe() {
    // do nothing
  }

  unobserve() {
    // do nothing
  }

  disconnect() {
    // do nothing
  }
}

window.ResizeObserver = ResizeObserver
// **

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<HistoricalSummariesGraph />', () => {
  it('renders correctly', async () => {
    const { queryByText } = render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <HistoricalSummariesGraph data={historicalSummariesData} setRange={() => {}} selectedRange="last30days" />
          </MemoryRouter>
        </I18nProvider>
      </ChakraProvider>,
    )
    expect(queryByText(/Last 30 Days/)).toBeInTheDocument()
  })
})
