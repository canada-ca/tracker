import React from 'react'
import { bool, string } from 'prop-types'
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Select,
  Stack,
  useToast,
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { Field, Formik } from 'formik'
import { useMutation } from '@apollo/client'

import { UPDATE_USER_PROFILE } from '../graphql/mutations'
import { useUserVar } from '../utilities/userState'
import {
  EmailIcon,
  PhoneIcon,
  RadioCheckedIcon,
  RadioUncheckedIcon,
} from '../theme/Icons'

export function EditableUserTFAMethod({
  currentTFAMethod,
  isUserAdmin,
  emailValidated,
  phoneValidated,
  ...props
}) {
  const toast = useToast()
  const { login, currentUser } = useUserVar()

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
          login({
            ...currentUser,
            tfaSendMethod: updateUserProfile.result.user.tfaSendMethod,
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
    <Box {...props}>
      <Heading as="h3" size="md" mb="3">
        <Trans>Two-Factor Authentication:</Trans>
      </Heading>
      <Stack isInline mb="4">
        <Box p="1">
          {emailValidated ? (
            <RadioCheckedIcon
              boxSize="icons.lg"
              mr="2"
              aria-label="Email is validated"
            />
          ) : (
            <RadioUncheckedIcon
              boxSize="icons.lg"
              mr="2"
              aria-label="Email is not validated"
            />
          )}
          <Badge variant="outline" color="gray.900" p="1">
            <EmailIcon mr="2" ml="1" boxSize="icons.lg" aria-hidden="true" />
            <Trans>Email Validated</Trans>
          </Badge>
        </Box>
        <Box p="1">
          {phoneValidated ? (
            <RadioCheckedIcon
              boxSize="icons.lg"
              mr="2"
              aria-label="Email is validated"
            />
          ) : (
            <RadioUncheckedIcon
              boxSize="icons.lg"
              mr="2"
              aria-label="Email is not validated"
            />
          )}
          <Badge variant="outline" color="gray.900" p="1.5">
            <PhoneIcon mr="2" ml="1" boxSize="1.1rem" aria-hidden="true" />
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
            <Flex
              align="center"
              borderWidth="1px"
              borderColor="gray.500"
              rounded="md"
              p="1"
            >
              <Field
                data-testid="tfa-method-select"
                id="tfaMethod"
                component={Select}
                {...getFieldProps('tfaMethod')}
                w="57%"
              >
                {(!isUserAdmin || currentTFAMethod === 'NONE') && (
                  <option value="NONE">{t`None`}</option>
                )}
                {emailValidated && <option value="EMAIL">{t`Email`}</option>}
                {phoneValidated && <option value="PHONE">{t`Phone`}</option>}
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

EditableUserTFAMethod.propTypes = {
  currentTFAMethod: string,
  isUserAdmin: bool,
  emailValidated: bool,
  phoneValidated: bool,
}
