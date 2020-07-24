import React from 'react'
import { string } from 'prop-types'
import { Heading, Button, Stack, Select } from '@chakra-ui/core'
import WithPseudoBox from './withPseudoBox'
import { Trans } from '@lingui/macro'
import { Formik, Field } from 'formik'

function EditableUserLanguage({ currentLang }) {
  return (
    <Stack spacing="4">
      <Heading as="h3" size="md">
        <Trans>Language:</Trans>
      </Heading>

      <Formik
        initialValues={{ lang: currentLang }}
        onSubmit={(_values, { setSubmitting }) => {
          setSubmitting(false)
        }}
      >
        {({ handleSubmit, isSubmitting, getFieldProps }) => (
          <form id="langForm" onSubmit={handleSubmit}>
            <Stack isInline align="center">
              <Field id="lang" component={Select} {...getFieldProps('lang')}>
                <option value="ENGLISH">English</option>
                <option value="FRENCH">Français</option>
              </Field>

              <Button type="submitBtn" isLoading={isSubmitting} px="2rem">
                <Trans>Save Language</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Stack>
  )
}

EditableUserLanguage.propTypes = {
  currentLang: string,
}

export default WithPseudoBox(EditableUserLanguage)
