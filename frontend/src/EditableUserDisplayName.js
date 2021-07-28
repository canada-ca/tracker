import React, { useRef } from 'react'
import { string } from 'prop-types'
import {
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
import { PersonIcon } from './theme/Icons'
import WithWrapperBox from './WithWrapperBox'
import { Formik } from 'formik'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import DisplayNameField from './DisplayNameField'
import { UPDATE_USER_PROFILE } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { fieldRequirements } from './fieldRequirements'
import { object, string as yupString } from 'yup'

function EditableUserDisplayName({ detailValue }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const initialFocusRef = useRef()

  const [updateUserProfile, { error: _updateUserProfileError }] = useMutation(
    UPDATE_USER_PROFILE,
    {
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while updating your display name.`,
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
            title: t`Changed User Display Name`,
            description: t`You have successfully updated your display name.`,
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
            title: t`Unable to update to your display name, please try again.`,
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
    displayName: yupString().required(
      i18n._(fieldRequirements.displayName.required.message),
    ),
  })

  return (
    <Stack>
      <Heading as="h3" size="md">
        <Trans>Display Name:</Trans>
      </Heading>

      <Flex align="center">
        <PersonIcon
          color="gray.300"
          mr={2}
          boxSize="icons.lg"
          aria-hidden="true"
        />
        <Text>{detailValue}</Text>
        <Button
          variant="primary"
          ml="auto"
          onClick={onOpen}
          fontSize="sm"
          px="3"
        >
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
        <ModalContent pb="4">
          <Formik
            validateOnBlur={false}
            initialValues={{
              displayName: '',
            }}
            initialTouched={{
              displayName: true,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
              // Submit update detail mutation
              await updateUserProfile({
                variables: {
                  displayName: values.displayName,
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
    </Stack>
  )
}

EditableUserDisplayName.propTypes = {
  detailValue: string,
}

export default WithWrapperBox(EditableUserDisplayName)
