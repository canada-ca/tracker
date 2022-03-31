import React, { useRef } from 'react'
import {
  Box,
  Button,
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
import { EditIcon } from '@chakra-ui/icons'
import { Formik } from 'formik'
import { t, Trans } from '@lingui/macro'
import { useMutation } from '@apollo/client'

import { PasswordField } from '../components/fields/PasswordField'
import { PasswordConfirmation } from '../components/fields/PasswordConfirmation'
import { createValidationSchema } from '../utilities/fieldRequirements'
import { UPDATE_USER_PASSWORD } from '../graphql/mutations'
import { LockIcon } from '../theme/Icons'

export function EditableUserPassword() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const initialFocusRef = useRef()

  const [updateUserPassword, { error: _updateUserPasswordError }] = useMutation(
    UPDATE_USER_PASSWORD,
    {
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while updating your password.`,
          description: message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted({ updateUserPassword }) {
        if (
          updateUserPassword.result.__typename ===
          'UpdateUserPasswordResultType'
        ) {
          toast({
            title: t`Changed User Password`,
            description: t`You have successfully updated your password.`,
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          onClose()
        } else if (
          updateUserPassword.result.__typename === 'UpdateUserPasswordError'
        ) {
          toast({
            title: t`Unable to update your password, please try again.`,
            description: updateUserPassword.result.description,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else {
          toast({
            title: t`Incorrect send method received.`,
            description: t`Incorrect updateUserPassword.result typename.`,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          console.log('Incorrect updateUserPassword.result typename.')
        }
      },
    },
  )

  return (
    <Box mb="4">
      <Heading as="h3" size="md" mb="1">
        <Trans>Password:</Trans>
      </Heading>

      <Flex
        align="center"
        borderWidth="1px"
        borderColor="gray.500"
        rounded="md"
        p="1"
      >
        <LockIcon mr="2" ml="1" boxSize="icons.lg" aria-hidden="true" />
        <Text fontSize="xs">∗∗∗∗∗∗∗∗∗∗∗</Text>
        <Button
          variant="primary"
          ml="auto"
          onClick={onOpen}
          fontSize="sm"
          px="3"
        >
          <EditIcon color="white" mr="2" boxSize="1rem" />
          <Trans>Edit</Trans>
        </Button>
      </Flex>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        initialFocusRef={initialFocusRef}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent pb={4}>
          <Formik
            validateOnBlur={false}
            initialValues={{
              password: '',
              confirmPassword: '',
              currentPassword: '',
            }}
            initialTouched={{
              currentPassword: true,
            }}
            validationSchema={createValidationSchema([
              'password',
              'confirmPassword',
              'currentPassword',
            ])}
            onSubmit={async (values) => {
              // Submit update detail mutation
              await updateUserPassword({
                variables: {
                  updatedPassword: values.password,
                  updatedPasswordConfirm: values.confirmPassword,
                  currentPassword: values.currentPassword,
                },
              })
            }}
          >
            {({ handleSubmit, isSubmitting }) => (
              <form id="form" onSubmit={handleSubmit}>
                <ModalHeader>
                  <Trans>Change Password</Trans>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Stack spacing={4} p="6" align="center">
                    <PasswordField
                      name="currentPassword"
                      label={t`Current Password:`}
                      width="100%"
                      ref={initialFocusRef}
                    />
                    <Text textAlign="center">
                      <Trans>Enter and confirm your new password below:</Trans>
                    </Text>
                    <PasswordConfirmation
                      width="100%"
                      passwordLabel={t`New Password:`}
                      confirmPasswordLabel={t`Confirm New Password:`}
                    />
                  </Stack>
                </ModalBody>

                <ModalFooter>
                  <Button
                    variant="primary"
                    isLoading={isSubmitting}
                    type="submit"
                    mr="4"
                  >
                    <Trans>Confirm</Trans>
                  </Button>
                </ModalFooter>
              </form>
            )}
          </Formik>
        </ModalContent>
      </Modal>
    </Box>
  )
}
