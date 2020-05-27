import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import LanguageSelect from '../LanguageSelect'

describe('<LanguageSelect />', () => {
  describe('by default', () => {
    it('renders language selection', async () => {
      const { getByTestId } = render(
        <I18nProvider i18n={setupI18n()}>
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
