import React from 'react'
import { string } from 'prop-types'
import { Heading, Button, Stack, Select, useToast } from '@chakra-ui/core'
import WithPseudoBox from './withPseudoBox'
import { t, Trans } from '@lingui/macro'
import { Formik, Field } from 'formik'
import { useMutation } from '@apollo/client'
import { UPDATE_USER_PROFILE } from './graphql/mutations'
import { useUserState } from './UserState'
import { useLingui } from '@lingui/react'
import { object, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'

function EditableUserLanguage({ currentLang }) {
  const { currentUser } = useUserState()
  const toast = useToast()
  const { i18n } = useLingui()

  const [updateUserProfile, { error: _updateUserProfileError }] = useMutation(
    UPDATE_USER_PROFILE,
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
      onError: ({ message }) => {
        toast({
          title: i18n._(t`An error occurred while updating your language.`),
          description: message,
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
      onCompleted() {
        toast({
          title: t`Changed User Language`,
          description: t`You have successfully updated your password.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
        })
      },
    },
  )

  const validationSchema = object().shape({
    lang: yupString()
      .required(i18n._(fieldRequirements.lang.required.message))
      .oneOf(fieldRequirements.lang.oneOf.types),
  })

  return (
    <Stack spacing="4">
      <Heading as="h3" size="md">
        <Trans>Language:</Trans>
      </Heading>

      <Formik
        validateOnBlur={false}
        initialValues={{ lang: currentLang }}
        validationSchema={validationSchema}
        onSubmit={async values => {
          // Submit update detail mutation
          await updateUserProfile({
            variables: {
              input: {
                preferredLang: values.lang,
              },
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting, getFieldProps }) => (
          <form id="langForm" onSubmit={handleSubmit}>
            <Stack isInline align="center">
              <Field id="lang" component={Select} {...getFieldProps('lang')}>
                <option value="ENGLISH">English</option>
                <option value="FRENCH">Français</option>
              </Field>

              <Button
                type="submitBtn"
                isLoading={isSubmitting}
                px="8"
                variantColor="teal"
              >
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
