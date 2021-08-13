import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { render } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

import { PhaseBanner } from '../../app/PhaseBanner'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<PhaseBanner />', () => {
  it('properly renders alpha banner', async () => {
    const { queryByText } = render(
      <ChakraProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <PhaseBanner phase="ALPHA" />
        </I18nProvider>
      </ChakraProvider>,
    )

    expect(queryByText(/ALPHA/)).toBeInTheDocument()
  })
})
