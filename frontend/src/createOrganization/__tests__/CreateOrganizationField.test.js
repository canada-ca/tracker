import React from 'react'
import { object, string } from 'yup'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

import { CreateOrganizationField } from '../CreateOrganizationField'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<CreateOrganizationField />', () => {
  describe('when validation fails', () => {
    it('displays an error message', async () => {
      const validationSchema = object().shape({
        acronym: string().required('sadness'),
      })

      const { getByText, getByLabelText } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <Formik
              // return a sadness error for the password field
              validationSchema={validationSchema}
              initialValues={{
                email: '',
              }}
            >
              {() => (
                <CreateOrganizationField
                  data-testid="CreateOrganizationField"
                  name="acronym"
                  label="Create Org Field:"
                />
              )}
            </Formik>
          </ChakraProvider>
        </I18nProvider>,
      )

      const input = getByLabelText(/Create Org Field/)
      fireEvent.blur(input)

      await waitFor(() => {
        expect(getByText(/sadness/)).toBeInTheDocument()
      })
    })
  })
})
