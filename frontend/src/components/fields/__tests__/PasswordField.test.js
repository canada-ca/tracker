import React from 'react'
import { object, string } from 'yup'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import userEvent from '@testing-library/user-event'

import { PasswordField } from '../PasswordField'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<PasswordField />', () => {
  describe('when validation fails', () => {
    it('displays an error message', async () => {
      const validationSchema = object().shape({
        password: string().required('sadness'),
      })
      const { getByText, getByLabelText } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <Formik
              // return a sadness error for the password field
              validationSchema={validationSchema}
              initialValues={{
                password: '',
              }}
            >
              {() => (
                <PasswordField name="password" label="Test Password Input" />
              )}
            </Formik>
          </ChakraProvider>
        </I18nProvider>,
      )

      const passwordInput = getByLabelText(/Test Password Input/)
      userEvent.click(passwordInput)
      userEvent.click(document.body)

      await waitFor(() => {
        expect(getByText('sadness')).toBeInTheDocument()
      })
    })
  })

  describe('by default', () => {
    it('renders a password field', async () => {
      const { getByLabelText } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <Formik
              initialValues={{
                password: '',
              }}
            >
              {() => (
                <PasswordField name="password" label="Test Password Input" />
              )}
            </Formik>
          </ChakraProvider>
        </I18nProvider>,
      )

      const passwordInput = getByLabelText(/Test Password Input/)

      expect(passwordInput.type).toEqual('password')
    })
  })

  describe('when the hide button is clicked', () => {
    it('renders a password field', async () => {
      const { getByRole } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <Formik
              initialValues={{
                password: '',
              }}
            >
              {() => <PasswordField name="password" />}
            </Formik>
          </ChakraProvider>
        </I18nProvider>,
      )

      const show = getByRole('button')

      fireEvent.click(show)

      const input = getByRole('textbox')

      await waitFor(() => {
        expect(input.type).toEqual('text')
      })
    })
  })
})
