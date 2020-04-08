import React from 'react'
import { i18n } from '@lingui/core'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { render } from '@testing-library/react'
import { TwoFactorNotificationBar } from '../TwoFactorNotificationBar'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<TwoFactorNotificationBar />', () => {
  // XXX: rework this test
  it('successfully renders the component on its own.', () => {
    render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <TwoFactorNotificationBar />
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(render).toBeTruthy()
  })
})
