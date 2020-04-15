import React from 'react'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { Footer } from '../Footer'
import { render } from '@testing-library/react'
import { setupI18n } from '@lingui/core'

describe('<Footer />', () => {
  beforeEach(() => (global.scrollTo = jest.fn()))

  it('renders children correctly', () => {
    const { getAllByText } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
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
