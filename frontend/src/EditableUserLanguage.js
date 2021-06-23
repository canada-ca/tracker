import React from 'react'
import { string } from 'prop-types'
import { Heading, Select, Stack, useToast } from '@chakra-ui/core'
import WithPseudoBox from './withPseudoBox'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { Field, Formik } from 'formik'
import { useMutation } from '@apollo/client'
import { UPDATE_USER_PROFILE } from './graphql/mutations'
import { object, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import { TrackerButton } from './TrackerButton'

function EditableUserLanguage({ currentLang }) {
  const toast = useToast()

  const [updateUserProfile, { error: _updateUserProfileError }] = useMutation(
    UPDATE_USER_PROFILE,
    {
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while updating your language.`,
          description: message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted({ updateUserProfile }) {
        if (updateUserProfile.result.__typename === 'UpdateUserProfileResult') {
          toast({
            title: t`Changed User Language`,
            description: t`You have successfully updated your preferred language.`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else if (
          updateUserProfile.result.__typename === 'UpdateUserProfileError'
        ) {
          toast({
            title: t`Unable to update to your preferred language, please try again.`,
            description: updateUserProfile.result.description,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else {
          toast({
            title: t`Incorrect send method received.`,
            description: t`Incorrect updateUserProfile.result typename.`,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          console.log('Incorrect updateUserProfile.result typename.')
        }
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
        onSubmit={async (values) => {
          // Submit update detail mutation
          await updateUserProfile({
            variables: {
              preferredLang: values.lang,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting, getFieldProps }) => (
          <form id="langForm" onSubmit={handleSubmit}>
            <Stack isInline align="center" justifyContent="space-between">
              <Field
                data-testid="user-language-select"
                id="lang"
                component={Select}
                {...getFieldProps('lang')}
                w={['40%', '57%']}
              >
                <option value="ENGLISH">English</option>
                <option value="FRENCH">Français</option>
              </Field>
              <TrackerButton
                type="submitBtn"
                isLoading={isSubmitting}
                variant="primary"
              >
                <Trans>Save Language</Trans>
              </TrackerButton>
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
