import React from 'react'
import { object, string } from 'yup'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { DomainField } from '../DomainField'

describe('<DomainField />', () => {
  describe('when validation fails', () => {
    it('displays an error message', async () => {
      const validationSchema = object().shape({
        domain: string().required('sadness'),
      })

      const { getByText, getByRole } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <Formik
              // return a sadness error for the password field
              validationSchema={validationSchema}
              initialValues={{
                domain: '',
              }}
            >
              {() => <DomainField label="Domain Field" name="domain" />}
            </Formik>
          </ChakraProvider>
        </I18nProvider>,
      )

      const input = getByRole('textbox', { name: /Domain Field/ })
      fireEvent.blur(input)

      await waitFor(() => {
        expect(getByText(/sadness/)).toBeInTheDocument()
      })
    })
  })
})
