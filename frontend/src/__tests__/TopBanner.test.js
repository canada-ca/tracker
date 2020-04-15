import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { TopBanner } from '../TopBanner'
import { render, cleanup } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<TopBanner />', () => {
  afterEach(cleanup)

  it('renders using the language prop correctly', () => {
    const { getByRole } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={setupI18n()}>
          <TopBanner lang="en" />
        </I18nProvider>
      </ThemeProvider>,
    )
    const test = getByRole('img')
    expect(test.getAttribute('alt')).toBe('Symbol of the Government of Canada')
  })
})
