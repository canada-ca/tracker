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
import DisplayNameField from './DisplayNameField'
import { UPDATE_USER_PROFILE } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { useUserState } from './UserState'
import { useLingui } from '@lingui/react'
import { fieldRequirements } from './fieldRequirements'
import { object, string as yupString } from 'yup'

function EditableUserDisplayName({ detailValue }) {
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
          title: i18n._(t`An error occurred while updating your display name.`),
          description: message,
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
      onCompleted() {
        toast({
          title: t`Changed User Display Name`,
          description: t`You have successfully updated your display name.`,
          status: 'success',
          duration: 9000,
          isClosable: true,
        })
        onClose()
      },
    },
  )

  const validationSchema = object().shape({
    displayName: yupString().required(
      i18n._(fieldRequirements.displayName.required.message),
    ),
  })

  return (
    <Stack>
      <Heading as="h3" size="md">
        <Trans>Display Name:</Trans>
      </Heading>

      <Stack isInline align="center">
        <Icon name="person" size="icons.lg" color="gray.300" />
        <Text>{detailValue}</Text>
        <Button
          ml="auto"
          onClick={onOpen}
          size="sm"
          color="gray.50"
          bg="blue.700"
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
                  displayName: '',
                }}
                initialTouched={{
                  displayName: true,
                }}
                validationSchema={validationSchema}
                onSubmit={async values => {
                  // Submit update detail mutation
                  await updateUserProfile({
                    variables: {
                      input: {
                        displayName: values.displayName,
                      },
                    },
                  })
                }}
              >
                {({ handleSubmit, isSubmitting }) => (
                  <form id="form" onSubmit={handleSubmit}>
                    <ModalHeader>
                      <Trans>Edit Display Name</Trans>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <Stack spacing="4" p="6">
                        <Heading as="h3" size="sm">
                          <Trans>Current Display Name:</Trans>
                        </Heading>

                        <Text>{detailValue}</Text>

                        <DisplayNameField
                          name="displayName"
                          label={t`New Display Name:`}
                          ref={initialFocusRef}
                        />
                      </Stack>
                    </ModalBody>

                    <ModalFooter>
                      <Button
                        color="gray.50"
                        bg="blue.700"
                        isLoading={isSubmitting}
                        type="submit"
                        mr="4"
                      >
                        <Trans>Confirm</Trans>
                      </Button>
                      <Button
                        color="gray.50"
                        bg="blue.700"
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

EditableUserDisplayName.propTypes = {
  detailValue: string,
}

export default WithPseudoBox(EditableUserDisplayName)
