import React from 'react'
import { MockedProvider } from '@apollo/client/testing'
import { render } from '@testing-library/react'
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
  httpsSummary: {
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
        name: 'implemented',
        count: 800,
        percentage: 80,
      },
    ],
    total: 1000,
  },
}

describe('<SummaryGroup />', () => {
  describe('given the data for HTTPS and email summaries', () => {
    it('displays HTTPS and dmarc phase summary cards', async () => {
      const { getByText } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <MockedProvider>
              <SummaryGroup
                https={data.httpsSummary}
                dmarcPhases={data.dmarcPhaseSummary}
              />
            </MockedProvider>
          </ChakraProvider>
        </I18nProvider>,
      )
      expect(
        getByText(
          /HTTPS is configured and HTTP connections redirect to HTTPS/i,
        ),
      ).toBeInTheDocument()
      expect(
        getByText(
          /A minimum DMARC policy of “p=none” with at least one address defined as a recipient of aggregate reports/i,
        ),
      ).toBeInTheDocument()
    })
  })
})
