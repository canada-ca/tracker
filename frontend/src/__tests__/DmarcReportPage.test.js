import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { DmarcReportPage } from '../DmarcReportPage'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<DmarcReportPage />', () => {
  afterEach(cleanup)

  it('successfully renders the component on its own', () => {
    render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MockedProvider>
              <DmarcReportPage />
            </MockedProvider>
          </MemoryRouter>
        </I18nProvider>
      </ThemeProvider>,
    )
    expect(render).toBeTruthy()
  })
})
