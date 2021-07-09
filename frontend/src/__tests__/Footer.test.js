import React from 'react'
import { I18nProvider } from '@lingui/react'
import { theme, ThemeProvider } from '@chakra-ui/react'
import { Footer } from '../Footer'
import { render } from '@testing-library/react'
import { setupI18n } from '@lingui/core'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

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
