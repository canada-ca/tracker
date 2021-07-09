import React from 'react'
import { object, string } from 'yup'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { theme, ThemeProvider } from '@chakra-ui/react'
import AuthenticateField from '../AuthenticateField'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<AuthenticateField />', () => {
  describe('when validation fails', () => {
    it('displays an error message', async () => {
      const validationSchema = object().shape({
        twoFactorCode: string().required('sadness'),
      })

      const { getByTestId, getByText } = render(
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <Formik
              // return a sadness error for the password field
              validationSchema={validationSchema}
              initialValues={{
                twoFactorCode: '',
              }}
              onSubmit={() => {}}
            >
              {() => (
                <AuthenticateField
                  data-testid="authenticatefield"
                  name="twoFactorCode"
                  sendMethod="phone"
                />
              )}
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
