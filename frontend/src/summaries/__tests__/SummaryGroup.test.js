import React from 'react'
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

import { SummaryGroup } from '../SummaryGroup'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const data = {
  webSummary: {
    categories: [
      {
        name: 'pass',
        count: 7468,
        percentage: 56.6,
      },
      {
        name: 'fail',
        count: 5738,
        percentage: 43.4,
      },
    ],
    total: 13206,
  },
  dmarcPhaseSummary: {
    categories: [
      {
        name: 'not implemented',
        count: 200,
        percentage: 20,
      },
      {
        name: 'assess',
        count: 200,
        percentage: 20,
      },
      {
        name: 'deploy',
        count: 200,
        percentage: 20,
      },
      {
        name: 'enforce',
        count: 200,
        percentage: 20,
      },
      {
        name: 'maintain',
        count: 200,
        percentage: 20,
      },
    ],
    total: 1000,
  },
}

describe('<SummaryGroup />', () => {
  describe('given the data for web and email summaries', () => {
    it('displays web and dmarc phase summary cards', async () => {
      const { getByText } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <MockedProvider>
              <SummaryGroup
                web={data.webSummary}
                dmarcPhases={data.dmarcPhaseSummary}
              />
            </MockedProvider>
          </ChakraProvider>
        </I18nProvider>,
      )
      expect(getByText(/web encryption settings summary/i)).toBeInTheDocument()
      expect(getByText(/dmarc phase summary/i)).toBeInTheDocument()
    })
  })
})
