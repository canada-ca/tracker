import React from 'react'
import { object, string } from 'yup'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { Formik } from 'formik'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

import { DisplayNameField } from '../components/DisplayNameField'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<DisplayNameField />', () => {
  describe('when validation fails', () => {
    it('displays an error message', async () => {
      const validationSchema = object().shape({
        displayName: string().required('sadness'),
      })

      const { getByTestId, getByText } = render(
        <I18nProvider i18n={i18n}>
          <ChakraProvider theme={theme}>
            <Formik
              // return a sadness error for the display name field
              validationSchema={validationSchema}
              initialValues={{
                displayName: '',
              }}
            >
              {() => (
                <DisplayNameField
                  data-testid="displayNameField"
                  name="displayName"
                />
              )}
            </Formik>
          </ChakraProvider>
        </I18nProvider>,
      )

      const input = getByTestId('displayNameField')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(getByText(/sadness/)).toBeInTheDocument()
      })
    })
  })
})
