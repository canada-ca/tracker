import React, { useRef } from 'react'
import {
  Icon,
  Heading,
  Button,
  Stack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  SlideIn,
  useDisclosure,
  useToast,
} from '@chakra-ui/core'
import WithPseudoBox from './withPseudoBox'
import { Formik } from 'formik'
import { t, Trans } from '@lingui/macro'
import { UPDATE_USER_PROFILE } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { useUserState } from './UserState'
import { useLingui } from '@lingui/react'
import { object, string } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import PasswordField from './PasswordField'
import PasswordConfirmation from './PasswordConfirmation'

function EditableUserPassword() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { currentUser } = useUserState()
  const toast = useToast()
  const { i18n } = useLingui()
  const initialFocusRef = useRef()

  const [updateUserProfile, { error: updateUserProfileError }] = useMutation(
    UPDATE_USER_PROFILE,
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
      onError() {
        console.log(updateUserProfileError)
        toast({
          title: i18n._(t`An error occurred.`),
          description: i18n._(
            t`Unable to update your password, please try again.`,
          ),
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
      onCompleted() {
        toast({
          title: 'Changed User Password',
          description: 'You have successfully updated your password.',
          status: 'success',
          duration: 9000,
          isClosable: true,
        })
        onClose()
      },
    },
  )

  return (
    <Stack>
      <Heading as="h3" size="md">
        <Trans>Password:</Trans>
      </Heading>

      <Stack isInline align="center">
        <Icon name="lock" color="gray.300" />
        <Text>************</Text>
        <Button ml="auto" onClick={onOpen} size="sm">
          <Trans>Edit</Trans>
        </Button>
      </Stack>

      <SlideIn in={isOpen}>
        {styles => (
          <Modal
            isOpen={true}
            onClose={onClose}
            initialFocusRef={initialFocusRef}
          >
            <ModalOverlay opacity={styles.opacity} />
            <ModalContent pb={4} {...styles}>
              <Formik
                initialValues={{
                  password: '',
                  confirmPassword: '',
                  currentPassword: '',
                }}
                validationSchema={object().shape({
                  password: fieldRequirements.password,
                  confirmPassword: fieldRequirements.confirmPassword,
                  currentPassword: string().required(
                    t`Please enter your current password.`,
                  ),
                })}
                onSubmit={async values => {
                  // Submit update detail mutation
                  await updateUserProfile({
                    variables: {
                      input: {
                        password: values.password,
                        confirmPassword: values.confirmPassword,
                        currentPassword: values.currentPassword,
                      },
                    },
                  })
                }}
              >
                {({ handleSubmit, isSubmitting }) => (
                  <form id="form" onSubmit={handleSubmit}>
                    <ModalHeader>Change Password</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <Stack spacing={4} p={25}>
                        <Stack spacing={4} align="center">
                          <PasswordField
                            name="currentPassword"
                            label="Current Password:"
                            width="100%"
                            ref={initialFocusRef}
                          />
                          <Text textAlign="center">
                            <Trans>
                              Enter and confirm your new password below:
                            </Trans>
                          </Text>
                          <PasswordConfirmation
                            width="100%"
                            passwordLabel="New Password:"
                            confirmPasswordLabel="Confirm New Password:"
                          />
                        </Stack>
                      </Stack>
                    </ModalBody>

                    <ModalFooter>
                      <Button
                        variantColor="teal"
                        isLoading={isSubmitting}
                        type="submit"
                        mr={4}
                      >
                        <Trans>Confirm</Trans>
                      </Button>
                      <Button
                        variantColor="teal"
                        variant="outline"
                        onClick={onClose}
                      >
                        <Trans>Close</Trans>
                      </Button>
                    </ModalFooter>
                  </form>
                )}
              </Formik>
            </ModalContent>
          </Modal>
        )}
      </SlideIn>
    </Stack>
  )
}

export default WithPseudoBox(EditableUserPassword)
