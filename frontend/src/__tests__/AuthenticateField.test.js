import React from 'react'
import { object, string } from 'yup'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import AuthenticateField from '../AuthenticateField'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<AuthenticateField />', () => {
  describe('when validation fails', () => {
    it('displays an error message', async () => {
      const validationSchema = object().shape({
        twoFactorCode: string().required('sadness'),
      })

      const { getByTestId, getByText } = render(
        <I18nProvider i18n={setupI18n()}>
          <ThemeProvider theme={theme}>
            <Formik
              // return a sadness error for the password field
              validationSchema={validationSchema}
              initialValues={{
                twoFactorCode: '',
              }}
            >
              {() => <AuthenticateField data-testid="authenticatefield" name="twoFactorCode" />}
            </Formik>
          </ThemeProvider>
        </I18nProvider>,
      )

      const input = getByTestId('authenticatefield')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(getByText(/sadness/)).toBeInTheDocument()
      })
    })
  })
})
