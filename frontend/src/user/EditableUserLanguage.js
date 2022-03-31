import React from 'react'

import { Box, Button, Heading, Select, Flex, useToast } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { Field, Formik } from 'formik'
import { useMutation } from '@apollo/client'
import { string } from 'prop-types'

import { UPDATE_USER_PROFILE } from '../graphql/mutations'
import { createValidationSchema } from '../utilities/fieldRequirements'

export function EditableUserLanguage({ currentLang }) {
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

  return (
    <Box>
      <Heading as="h3" size="md" mb="1">
        <Trans>Language:</Trans>
      </Heading>

      <Formik
        validateOnBlur={false}
        initialValues={{ lang: currentLang }}
        validationSchema={createValidationSchema(['lang'])}
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
            <Flex
              align="center"
              borderWidth="1px"
              borderColor="gray.500"
              rounded="md"
              p="1"
            >
              <Field
                data-testid="user-language-select"
                id="lang"
                component={Select}
                {...getFieldProps('lang')}
                w="57%"
              >
                <option value="ENGLISH">English</option>
                <option value="FRENCH">Français</option>
              </Field>
              <Button
                variant="primary"
                type="submitBtn"
                isLoading={isSubmitting}
                ml="auto"
              >
                <Trans>Save</Trans>
              </Button>
            </Flex>
          </form>
        )}
      </Formik>
    </Box>
  )
}

EditableUserLanguage.propTypes = {
  currentLang: string,
}
