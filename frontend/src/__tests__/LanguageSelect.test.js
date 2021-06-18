import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ThemeProvider } from '@chakra-ui/core'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import LanguageSelect from '../LanguageSelect'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<LanguageSelect />', () => {
  describe('by default', () => {
    it('renders language selection', async () => {
      const { getByTestId } = render(
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <Formik
              initialValues={{
                lang: '',
              }}
            >
              {() => (
                <LanguageSelect data-testid="languageselect" name="lang" />
              )}
            </Formik>
          </ThemeProvider>
        </I18nProvider>,
      )

      const input = getByTestId('languageselect')

      await waitFor(() => {
        expect(input.type).toEqual('select-one')
      })
    })
  })
})
