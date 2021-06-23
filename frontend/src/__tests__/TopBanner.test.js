import React from 'react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { TopBanner } from '../TopBanner'
import { cleanup, render } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<TopBanner />', () => {
  afterEach(cleanup)

  it('renders using the language prop correctly', () => {
    const { getByAltText } = render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={['/']}>
            <I18nProvider i18n={i18n}>
              <TopBanner lang="en" />
            </I18nProvider>
          </MemoryRouter>
        </ThemeProvider>
      </MockedProvider>,
    )
    expect(getByAltText('Symbol of the Government of Canada'))
  })
})
