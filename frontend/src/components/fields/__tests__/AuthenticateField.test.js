import React from 'react'
import { object, string } from 'yup'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

import { AuthenticateField } from '../AuthenticateField'

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

      const { getByRole, getByText } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <Formik
              // return a sadness error for the password field
              validationSchema={validationSchema}
              initialValues={{
                twoFactorCode: '',
              }}
              onSubmit={() => {}}
            >
              {() => <AuthenticateField sendMethod="phone" />}
            </Formik>
          </ChakraProvider>
        </I18nProvider>,
      )

      const authenticateInput = getByRole('textbox', {
        name: /Please enter your two factor code below/i,
      })
      fireEvent.blur(authenticateInput)

      await waitFor(() => {
        expect(getByText(/sadness/)).toBeInTheDocument()
      })
    })
  })
})
