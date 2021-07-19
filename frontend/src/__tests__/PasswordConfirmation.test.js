import React from 'react'
import { object, string } from 'yup'
import { render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import PasswordConfirmation from '../PasswordConfirmation'
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

describe('<PasswordConfirmation />', () => {
  it('renders within a <Formik> wrapper', async () => {
    const validationSchema = object().shape({
      password: string().required('sadness'),
      confirmPassword: string().required('sadness'),
    })

    const { container } = render(
      <I18nProvider i18n={i18n}>
        <ChakraProvider theme={theme}>
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
        </ChakraProvider>
      </I18nProvider>,
    )

    expect(container).toBeTruthy()
  })

  describe('given no input', () => {
    it('displays the lock icon', async () => {
      const validationSchema = object().shape({
        password: string().required('sadness'),
        confirmPassword: string().required('sadness'),
      })

      const { getByLabelText } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
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
          </ChakraProvider>
        </I18nProvider>,
      )
      await waitFor(() => expect(getByLabelText(/initial icon/)).toBeVisible())
    })
  })
})
