import React from 'react'
import { element, string } from 'prop-types'
import {
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Heading,
  InputRightElement,
  Button,
  Stack,
  Select,
} from '@chakra-ui/core'
import WithPseudoBox from './withPseudoBox'
import { t } from '@lingui/macro'
import { Formik, Field } from 'formik'

function EditableUserLanguage({
  detailName,
  iconName,
  iconSize,
  rightInputElement,
  currentLang,
  ...props
}) {
  const iconElement =
    iconName !== undefined ? (
      <InputLeftElement>
        <Icon name={iconName} size={iconSize} color="gray.300" />
      </InputLeftElement>
    ) : (
      ''
    )
  return (
    <Stack spacing="4">
      <Heading as="h3" size="md">
        Language:
      </Heading>

      {console.log(currentLang)}

      <Formik
        initialValues={{ lang: currentLang }}
        onSubmit={(_values, { setSubmitting }) => {
          console.log('submitting')
          setSubmitting(false)
        }}
      >
        {({ handleSubmit, isSubmitting, getFieldProps }) => (
          <form id="langForm" onSubmit={handleSubmit}>
            <Stack isInline width="100%" align="space-between">
              <Field
                {...props}
                id="lang"
                component={Select}
                {...getFieldProps('lang')}
              >
                <option value="ENGLISH">English</option>
                <option value="FRENCH">Français</option>
              </Field>

              <Button type="submitBtn" isLoading={isSubmitting} px="2rem">
                Save Language
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Stack>
  )
}

EditableUserLanguage.propTypes = {
  detailName: string,
  iconName: string,
  iconSize: string,
  rightInputElement: element,
}

export default WithPseudoBox(EditableUserLanguage)
