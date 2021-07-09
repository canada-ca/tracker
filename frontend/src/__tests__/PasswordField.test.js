import React from 'react'
import { object, string } from 'yup'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { theme, ThemeProvider } from '@chakra-ui/react'
import PasswordField from '../PasswordField'
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

describe('<PasswordField />', () => {
  describe('when validation fails', () => {
    it('displays an error message', async () => {
      const validationSchema = object().shape({
        password: string().required('sadness'),
      })
      const { getByTestId, getByText } = render(
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <Formik
              // return a sadness error for the password field
              validationSchema={validationSchema}
              initialValues={{
                password: '',
              }}
            >
              {() => <PasswordField data-testid="pwfield" name="password" />}
            </Formik>
          </ThemeProvider>
        </I18nProvider>,
      )
      const input = getByTestId('pwfield')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(getByText('sadness')).toBeInTheDocument()
      })
    })
  })

  describe('by default', () => {
    it('renders a password field', async () => {
      const { getByTestId } = render(
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <Formik
              initialValues={{
                password: '',
              }}
            >
              {() => <PasswordField data-testid="pwfield" name="password" />}
            </Formik>
          </ThemeProvider>
        </I18nProvider>,
      )

      const input = getByTestId('pwfield')

      await waitFor(() => {
        expect(input.type).toEqual('password')
      })
    })
  })

  describe('when the hide button is clicked', () => {
    it('renders a password field', async () => {
      const { getByRole } = render(
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <Formik
              initialValues={{
                password: '',
              }}
            >
              {() => <PasswordField name="password" />}
            </Formik>
          </ThemeProvider>
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
