import React from 'react'
import { object, string } from 'yup'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import CreateOrganizationField from '../CreateOrganizationField'
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

describe('<CreateOrganizationField />', () => {
  describe('when validation fails', () => {
    it('displays an error message', async () => {
      const validationSchema = object().shape({
        acronym: string().required('sadness'),
      })

      const { getByTestId, getByText } = render(
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
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
                />
              )}
            </Formik>
          </ThemeProvider>
        </I18nProvider>,
      )

      const input = getByTestId('CreateOrganizationField')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(getByText(/sadness/)).toBeInTheDocument()
      })
    })
  })
})
