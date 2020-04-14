import React from 'react'
import { object, string } from 'yup'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { EmailField } from '../EmailField'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { en } from 'make-plural/plurals'

i18n.loadLocaleData('en', { plurals: en })
i18n.load('en', { en: {} })
i18n.activate('en')

describe('<EmailField />', () => {
  describe('when validation fails', () => {
    it('displays an error message', async () => {
      const validationSchema = object().shape({
        email: string().required('sadness'),
      })

      const { getByTestId, getByText } = render(
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <Formik
              // return a sadness error for the password field
              validationSchema={validationSchema}
              initialValues={{
                email: '',
              }}
            >
              {() => <EmailField data-testid="emailfield" name="email" />}
            </Formik>
          </ThemeProvider>
        </I18nProvider>,
      )

      const input = getByTestId('emailfield')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(getByText(/sadness/)).toBeInTheDocument()
      })
    })
  })
})
