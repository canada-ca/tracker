import React from 'react'
import { bool, string } from 'prop-types'
import {
  Badge,
  Box,
  Button,
  Heading,
  Select,
  Stack,
  useToast,
} from '@chakra-ui/react'
import { CheckIcon, CloseIcon } from '@chakra-ui/icons'
import WithWrapperBox from './WithWrapperBox'
import { t, Trans } from '@lingui/macro'
import { Field, Formik } from 'formik'
import { useMutation } from '@apollo/client'
import { UPDATE_USER_PROFILE } from './graphql/mutations'

function EditableUserTFAMethod({
  currentTFAMethod,
  emailValidated,
  phoneValidated,
}) {
  const toast = useToast()

  const [updateUserProfile, { error: _updateUserProfileError }] = useMutation(
    UPDATE_USER_PROFILE,
    {
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while updating your TFA send method.`,
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
            title: t`Changed TFA Send Method`,
            description: t`You have successfully updated your TFA send method.`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else if (
          updateUserProfile.result.__typename === 'UpdateUserProfileError'
        ) {
          toast({
            title: t`Unable to update to your TFA send method, please try again.`,
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
    <Stack spacing="4">
      <Heading as="h3" size="md">
        <Trans>Two-Factor Authentication:</Trans>
      </Heading>
      <Stack isInline>
        <Box p="1">
          {emailValidated ? (
            <CheckIcon
              boxSize="icons.lg"
              color={emailValidated ? 'green.500' : 'red.500'}
              pr={2}
            />
          ) : (
            <CloseIcon
              boxSize="icons.lg"
              color={emailValidated ? 'green.500' : 'red.500'}
              pr={2}
            />
          )}
          <Badge variant="outline" color="gray.900">
            <Trans>Email Validated</Trans>
          </Badge>
        </Box>
        <Box p="1">
          {phoneValidated ? (
            <CheckIcon
              boxSize="icons.lg"
              color={phoneValidated ? 'green.500' : 'red.500'}
              pr={2}
            />
          ) : (
            <CloseIcon
              boxSize="icons.lg"
              color={phoneValidated ? 'green.500' : 'red.500'}
              pr={2}
            />
          )}
          <Badge variant="outline" color="gray.900">
            <Trans>Phone Validated</Trans>
          </Badge>
        </Box>
      </Stack>
      <Formik
        validateOnBlur={false}
        initialValues={{ tfaMethod: currentTFAMethod }}
        onSubmit={async (values) => {
          // Submit update detail mutation
          await updateUserProfile({
            variables: {
              tfaSendMethod: values.tfaMethod,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting, getFieldProps }) => (
          <form id="tfaForm" onSubmit={handleSubmit}>
            <Stack isInline align="center" justifyContent="space-between">
              <Field
                data-testid="tfa-method-select"
                id="tfaMethod"
                component={Select}
                {...getFieldProps('tfaMethod')}
                w="57%"
              >
                <option value="NONE">{t`None`}</option>
                {emailValidated && <option value="EMAIL">{t`Email`}</option>}
                {phoneValidated && <option value="PHONE">{t`Phone`}</option>}
              </Field>
              <Button
                variant="primary"
                type="submitBtn"
                isLoading={isSubmitting}
              >
                <Trans>Save</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Stack>
  )
}

EditableUserTFAMethod.propTypes = {
  currentTFAMethod: string,
  emailValidated: bool,
  phoneValidated: bool,
}

export default WithWrapperBox(EditableUserTFAMethod)
