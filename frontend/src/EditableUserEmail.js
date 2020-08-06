import React, { useRef } from 'react'
import { string } from 'prop-types'
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
import { object, string as yupString } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import EmailField from './EmailField'

function EditableUserEmail({ detailValue }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { currentUser } = useUserState()
  const toast = useToast()
  const { i18n } = useLingui()
  const initialFocusRef = useRef()

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
          title: i18n._(
            t`An error occurred while updating your email address.`,
          ),
          description: message,
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
      onCompleted() {
        toast({
          title: t`Changed User Email`,
          description: t`You have successfully updated your email.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
        })
        onClose()
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

      <Stack isInline align="center">
        <Icon name="email" color="gray.300" />
        <Text>{detailValue}</Text>
        <Button
          ml="auto"
          onClick={onOpen}
          size="sm"
          color="gray.50"
          bg="blue.900"
        >
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
            <ModalContent pb="4" {...styles}>
              <Formik
                validateOnBlur={false}
                initialValues={{
                  email: '',
                }}
                initialTouched={{
                  email: true,
                }}
                validationSchema={validationSchema}
                onSubmit={async values => {
                  // Submit update detail mutation
                  await updateUserProfile({
                    variables: {
                      input: {
                        userName: values.email,
                      },
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
                      <Button
                        color="gray.50"
                        bg="blue.900"
                        isLoading={isSubmitting}
                        type="submit"
                        mr="4"
                      >
                        <Trans>Confirm</Trans>
                      </Button>
                      <Button
                        color="gray.50"
                        bg="blue.900"
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

EditableUserEmail.propTypes = {
  detailValue: string,
}

export default WithPseudoBox(EditableUserEmail)
