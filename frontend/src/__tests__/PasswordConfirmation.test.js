import React from 'react'
import { i18n } from '@lingui/core'
import { object, string } from 'yup'
import { render, cleanup, getByRole } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { PasswordConfirmation } from '../PasswordConfirmation'
import { Formik } from 'formik'
i18n.load('en', { en: {} })
i18n.activate('en')

describe('<PasswordConfirmation />', () => {
  afterEach(cleanup)

  test('the component renders within a <Formik> wrapper', async () => {
    const validationSchema = object().shape({
      password: string().required('sadness'),
      confirmPassword: string().required('sadness'),
    })

    const { container } = render(
      <I18nProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <Formik
            // return a sadness error for the password field
            validationSchema={validationSchema}
            initialValues={{
              password: '',
              confirmPassword: '',
            }}
          >
            {() => <PasswordConfirmation data-testid="pwfield" />}
          </Formik>
        </ThemeProvider>
      </I18nProvider>,
    )

    expect(container).toBeTruthy()
  })

  test('an empty input for password field displays an error icon', async () => {
    const validationSchema = object().shape({
      password: string().required('sadness'),
      confirmPassword: string().required('sadness'),
    })

    const { container } = render(
      <I18nProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <Formik
            // return a sadness error for the password field
            validationSchema={validationSchema}
            initialValues={{
              password: '',
              confirmPassword: '',
            }}
          >
            {() => <PasswordConfirmation data-testid="pwfield" />}
          </Formik>
        </ThemeProvider>
      </I18nProvider>,
    )

    expect(render).toBeTruthy()

    const icon = getByRole(container, 'passwordIcon')
    expect(icon).toBeTruthy()
    console.log(icon)
  })
})
