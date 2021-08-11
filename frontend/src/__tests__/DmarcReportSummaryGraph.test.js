import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { DmarcReportSummaryGraph } from '../DmarcReportSummaryGraph'
import { formattedBarData } from '../fixtures/summaryListData'
import userEvent from '@testing-library/user-event'
import canada from '../theme/canada'

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

describe('<DmarcReportSummaryGraph />', () => {
  it('renders correctly', async () => {
    const { getByText } = render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <DmarcReportSummaryGraph data={formattedBarData} />
        </I18nProvider>
      </ChakraProvider>,
    )
    getByText(/Aug-21/i, { selector: 'text' })
  })

  describe('is vertical', () => {
    it('shows tooltip', async () => {
      const { getByText, container, queryByText } = render(
        <ChakraProvider theme={canada}>
          <I18nProvider i18n={i18n}>
            <DmarcReportSummaryGraph data={formattedBarData} />
          </I18nProvider>
        </ChakraProvider>,
      )
      getByText(/Aug-21/i, { selector: 'text' })

      const { strong } = canada.colors

      // query bottom-left "strong" rectangle
      const firstStrongRect = container.querySelector(`rect[fill="${strong}"]`)
      expect(firstStrongRect).toBeInTheDocument()

      expect(
        queryByText(
          (_content, element) => element.textContent === 'Pass:2,048',
        ),
      ).not.toBeInTheDocument()

      userEvent.hover(firstStrongRect)

      await waitFor(() =>
        expect(
          getByText(
            (_content, element) => element.textContent === 'Pass:2,048',
          ),
        ).toBeInTheDocument(),
      )
    })
  })
  describe('is horizontal', () => {
    it('shows tooltip', async () => {
      const { getByText, container, queryByText, getByRole } = render(
        <ChakraProvider theme={canada}>
          <I18nProvider i18n={i18n}>
            <DmarcReportSummaryGraph data={formattedBarData} />
          </I18nProvider>
        </ChakraProvider>,
      )
      getByText(/Aug-21/i, { selector: 'text' })

      const graphDirectionSelect = getByRole('combobox', {
        name: /Graph direction:/i,
      })
      userEvent.selectOptions(graphDirectionSelect, 'Horizontal View')

      const { strong } = canada.colors

      // query bottom-left "strong" rectangle
      const firstStrongRect = container.querySelector(`rect[fill="${strong}"]`)
      expect(firstStrongRect).toBeInTheDocument()

      expect(
        queryByText(
          (_content, element) => element.textContent === 'Pass:2,048',
        ),
      ).not.toBeInTheDocument()

      userEvent.hover(firstStrongRect)

      await waitFor(() =>
        expect(
          getByText(
            (_content, element) => element.textContent === 'Pass:2,048',
          ),
        ).toBeInTheDocument(),
      )
    })
  })
})
