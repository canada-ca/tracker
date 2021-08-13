import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural/plurals'

import { InfoButton, InfoBox, InfoPanel } from '../InfoPanel'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('<InfoPanel>', () => {
  it('successfully renders with mocked data', async () => {
    const state = {
      isVisible: true,
    }
    const { getByText } = render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <InfoPanel state={state}>
            <InfoBox title="Domain" info="The domain address." />
            <InfoBox
              title="Total Messages"
              info="Shows the total number of emails that have been sent by this domain during the selected time range."
            />
          </InfoPanel>
        </I18nProvider>
      </ChakraProvider>,
    )

    await waitFor(() => getByText(/The domain address./i))
  })

  describe('<InfoButton>', () => {
    it('successfully renders with mocked data', async () => {
      const { getByText } = render(
        <ChakraProvider theme={theme}>
          <I18nProvider i18n={i18n}>
            <InfoButton label="Glossary" />
          </I18nProvider>
        </ChakraProvider>,
      )

      await waitFor(() => getByText(/Glossary/i))
    })
  })
})
