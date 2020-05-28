import React from 'react'
import { object, string } from 'yup'
import { waitFor, render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import PasswordConfirmation from '../PasswordConfirmation'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<PasswordConfirmation />', () => {
  it('renders within a <Formik> wrapper', async () => {
    const validationSchema = object().shape({
      password: string().required('sadness'),
      confirmPassword: string().required('sadness'),
    })

    const { container } = render(
      <I18nProvider i18n={setupI18n()}>
        <ThemeProvider theme={theme}>
          <Formik
            // return a sadness error for the password field
            validationSchema={validationSchema}
            initialValues={{
              password: '',
              confirmPassword: '',
            }}
          >
            {() => <PasswordConfirmation />}
          </Formik>
        </ThemeProvider>
      </I18nProvider>,
    )

    expect(container).toBeTruthy()
  })

  describe('given no input', () => {
    it('displays an error icon', async () => {
      const validationSchema = object().shape({
        password: string().required('sadness'),
        confirmPassword: string().required('sadness'),
      })

      const { getByRole } = render(
        <I18nProvider i18n={setupI18n()}>
          <ThemeProvider theme={theme}>
            <Formik
              // return a sadness error for the password field
              validationSchema={validationSchema}
              initialValues={{
                password: '',
                confirmPassword: '',
              }}
            >
              {() => <PasswordConfirmation />}
            </Formik>
          </ThemeProvider>
        </I18nProvider>,
      )
      await waitFor(() => expect(getByRole('img')).toBeInTheDocument())
    })
  })
})
