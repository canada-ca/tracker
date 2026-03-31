import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { LanguageSelect } from '../LanguageSelect'

describe('<LanguageSelect />', () => {
  describe('by default', () => {
    it('renders language selection', async () => {
      const { getByRole } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <Formik
              initialValues={{
                lang: '',
              }}
            >
              {() => <LanguageSelect name="lang" />}
            </Formik>
          </ChakraProvider>
        </I18nProvider>,
      )

      const languageSelect = getByRole('combobox', {
        name: /Language:/,
      })

      await waitFor(() => {
        expect(languageSelect.type).toEqual('select-one')
      })
    })
  })
})
