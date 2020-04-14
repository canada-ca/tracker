import React from 'react'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { Footer } from '../Footer'
import { render } from '@testing-library/react'
import { i18n } from '@lingui/core'
import { en } from 'make-plural/plurals'

i18n.loadLocaleData('en', { plurals: en })
i18n.load('en', { en: {} })
i18n.activate('en')

describe('<Footer />', () => {
  beforeEach(() => (global.scrollTo = jest.fn()))

  it('renders children correctly', () => {
    const { getAllByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <Footer>
            <div>foo</div>
          </Footer>
        </I18nProvider>
      </ThemeProvider>,
    )

    const test = getAllByText(/foo/)
    expect(test).toHaveLength(1)
  })
})
