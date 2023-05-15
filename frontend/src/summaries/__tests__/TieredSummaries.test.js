import React from 'react'
import { MockedProvider } from '@apollo/client/testing'
import { render } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

import { TieredSummaries } from '../TieredSummaries'
import { UserVarProvider } from '../../utilities/userState'
import { makeVar } from '@apollo/client'

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
  httpsIncludeHidden: {
    total: 8200,
    categories: [
      {
        name: 'pass',
        count: 372,
        percentage: 4.536585365853658,
      },
      {
        name: 'fail',
        count: 7828,
        percentage: 95.46341463414635,
      },
    ],
  },
  dmarcIncludeHidden: {
    total: 7465,
    categories: [
      {
        name: 'pass',
        count: 1143,
        percentage: 15.311453449430676,
      },
      {
        name: 'fail',
        count: 6322,
        percentage: 84.68854655056933,
      },
    ],
  },
  https: {
    total: 8992,
    categories: [
      {
        name: 'pass',
        count: 3036,
        percentage: 33.763345195729535,
      },
      {
        name: 'fail',
        count: 5956,
        percentage: 66.23665480427047,
      },
    ],
  },
  dmarc: {
    total: 9274,
    categories: [
      {
        name: 'pass',
        count: 8805,
        percentage: 94.94285098123787,
      },
      {
        name: 'fail',
        count: 469,
        percentage: 5.057149018762132,
      },
    ],
  },
  webConnections: {
    total: 4199,
    categories: [
      {
        name: 'pass',
        count: 3648,
        percentage: 86.87782805429865,
      },
      {
        name: 'fail',
        count: 551,
        percentage: 13.122171945701353,
      },
    ],
  },
  ssl: {
    total: 4204,
    categories: [
      {
        name: 'pass',
        count: 296,
        percentage: 7.040913415794481,
      },
      {
        name: 'fail',
        count: 3908,
        percentage: 92.95908658420552,
      },
    ],
  },
  spf: {
    total: 8509,
    categories: [
      {
        name: 'pass',
        count: 2641,
        percentage: 31.037724762016687,
      },
      {
        name: 'fail',
        count: 5868,
        percentage: 68.9622752379833,
      },
    ],
  },
  dkim: {
    total: 5692,
    categories: [
      {
        name: 'pass',
        count: 1883,
        percentage: 33.08151791988756,
      },
      {
        name: 'fail',
        count: 3809,
        percentage: 66.91848208011244,
      },
    ],
  },
  dmarcPhase: {
    total: 3348,
    categories: [
      {
        name: 'not implemented',
        count: 312,
        percentage: 9.31899641577061,
      },
      {
        name: 'assess',
        count: 1351,
        percentage: 40.35244922341696,
      },
      {
        name: 'deploy',
        count: 204,
        percentage: 6.093189964157706,
      },
      {
        name: 'enforce',
        count: 57,
        percentage: 1.702508960573477,
      },
      {
        name: 'maintain',
        count: 1424,
        percentage: 42.53285543608124,
      },
    ],
  },
  web: {
    total: 5911,
    categories: [
      {
        name: 'pass',
        count: 5848,
        percentage: 98.93419049230249,
      },
      {
        name: 'fail',
        count: 63,
        percentage: 1.0658095076975087,
      },
    ],
  },
  mail: {
    total: 4531,
    categories: [
      {
        name: 'pass',
        count: 1905,
        percentage: 42.04369896270139,
      },
      {
        name: 'fail',
        count: 2626,
        percentage: 57.95630103729861,
      },
    ],
  },
}

describe('<TieredSummaries />', () => {
  describe('given the data for the tiered summaries', () => {
    it('displays tier 1 summary cards', async () => {
      const { getByText } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <MockedProvider>
              <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
                <TieredSummaries summaries={data} />
              </UserVarProvider>
            </MockedProvider>
          </ChakraProvider>
        </I18nProvider>,
      )
      expect(getByText(/HTTPS is configured and HTTP connections redirect to HTTPS/i)).toBeInTheDocument()
    })
  })
})
