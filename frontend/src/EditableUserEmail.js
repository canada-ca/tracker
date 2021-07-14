import React, { useRef } from 'react'
import { string } from 'prop-types'
import {
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { EmailIcon } from '@chakra-ui/icons'
import WithWrapperBox from './WithWrapperBox'
import { Formik } from 'formik'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { UPDATE_USER_PROFILE } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { object, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import EmailField from './EmailField'
import { TrackerButton } from './TrackerButton'

function EditableUserEmail({ detailValue }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const initialFocusRef = useRef()

  const [updateUserProfile, { error: _updateUserProfileError }] = useMutation(
    UPDATE_USER_PROFILE,
    {
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while updating your email address.`,
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
            title: t`Changed User Email`,
            description: t`You have successfully updated your email.`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          onClose()
        } else if (
          updateUserProfile.result.__typename === 'UpdateUserProfileError'
        ) {
          toast({
            title: t`Unable to update to your username, please try again.`,
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
    email: yupString()
      .required(i18n._(fieldRequirements.email.required.message))
      .email(i18n._(fieldRequirements.email.email.message)),
  })

  return (
    <Stack>
      <Heading as="h3" size="md">
        <Trans>Email:</Trans>
      </Heading>

      <Flex align="center">
        <EmailIcon color="gray.300" mr={2} />
        <Text>{detailValue}</Text>
        <TrackerButton
          ml="auto"
          onClick={onOpen}
          variant="primary"
          fontSize="sm"
          px="3"
        >
          <Trans>Edit</Trans>
        </TrackerButton>
      </Flex>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        initialFocusRef={initialFocusRef}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent pb="4">
          <Formik
            validateOnBlur={false}
            initialValues={{
              email: '',
            }}
            initialTouched={{
              email: true,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
              // Submit update detail mutation
              await updateUserProfile({
                variables: {
                  userName: values.email,
                },
              })
            }}
          >
            {({ handleSubmit, isSubmitting }) => (
              <form id="form" onSubmit={handleSubmit}>
                <ModalHeader>
                  <Trans>Edit Email</Trans>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Stack spacing="4" p="6">
                    <Heading as="h3" size="sm">
                      <Trans>Current Email:</Trans>
                    </Heading>

                    <Text>{detailValue}</Text>

                    <EmailField
                      name="email"
                      label={t`New Email Address:`}
                      ref={initialFocusRef}
                    />
                  </Stack>
                </ModalBody>

                <ModalFooter>
                  <TrackerButton
                    isLoading={isSubmitting}
                    type="submit"
                    mr="4"
                    variant="primary"
                  >
                    <Trans>Confirm</Trans>
                  </TrackerButton>
                </ModalFooter>
              </form>
            )}
          </Formik>
        </ModalContent>
      </Modal>
    </Stack>
  )
}

EditableUserEmail.propTypes = {
  detailValue: string,
}

export default WithWrapperBox(EditableUserEmail)
