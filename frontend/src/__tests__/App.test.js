import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { render, cleanup } from '@testing-library/react'
import App from '../App'

i18n.load('en', { en: {} })
i18n.activate('en')

describe('<App/>', () => {
  afterEach(cleanup)

  describe('routes', () => {
    describe('/', () => {
      it('renders the main page', () => {
        const { getByRole } = render(
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={1}>
                <App />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>,
        )
        expect(getByRole('heading')).toHaveTextContent(/track web/i)
      })
    })
  })
})
