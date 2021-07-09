import React, { useRef } from 'react'
import {
  Heading,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SlideIn,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import WithWrapperBox from './WithWrapperBox'
import { Formik } from 'formik'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { UPDATE_USER_PASSWORD } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { object, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import PasswordField from './PasswordField'
import PasswordConfirmation from './PasswordConfirmation'
import { TrackerButton } from './TrackerButton'

function EditableUserPassword() {
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

  const validationSchema = object().shape({
    password: yupString()
      .required(i18n._(fieldRequirements.password.required.message))
      .min(
        fieldRequirements.password.min.minLength,
        i18n._(fieldRequirements.password.min.message),
      ),
    confirmPassword: yupString()
      .required(i18n._(fieldRequirements.confirmPassword.required.message))
      .oneOf(
        fieldRequirements.confirmPassword.oneOf.types,
        i18n._(fieldRequirements.confirmPassword.oneOf.message),
      ),
    currentPassword: yupString().required(
      t`Please enter your current password.`,
    ),
  })

  return (
    <Stack>
      <Heading as="h3" size="md">
        <Trans>Password:</Trans>
      </Heading>

      <Stack isInline align="center">
        <Icon name="lock" color="gray.300" />
        <Text fontSize="xs">∗∗∗∗∗∗∗∗∗∗∗</Text>
        <TrackerButton
          ml="auto"
          onClick={onOpen}
          variant="primary"
          fontSize="sm"
          px="3"
        >
          <Trans>Edit</Trans>
        </TrackerButton>
      </Stack>

      <SlideIn in={isOpen}>
        {(styles) => (
          <Modal
            isOpen={true}
            onClose={onClose}
            initialFocusRef={initialFocusRef}
          >
            <ModalOverlay opacity={styles.opacity} />
            <ModalContent pb={4} {...styles}>
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
                validationSchema={validationSchema}
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
                          <Trans>
                            Enter and confirm your new password below:
                          </Trans>
                        </Text>
                        <PasswordConfirmation
                          width="100%"
                          passwordLabel={t`New Password:`}
                          confirmPasswordLabel={t`Confirm New Password:`}
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
        )}
      </SlideIn>
    </Stack>
  )
}

export default WithWrapperBox(EditableUserPassword)
