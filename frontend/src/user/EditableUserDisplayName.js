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
import { UserIcon } from '../theme/Icons'
import { Formik } from 'formik'
import { t, Trans } from '@lingui/macro'
import { useMutation } from '@apollo/client'
import { string } from 'prop-types'

import { DisplayNameField } from '../components/fields/DisplayNameField'
import { createValidationSchema } from '../utilities/fieldRequirements'
import { UPDATE_USER_PROFILE } from '../graphql/mutations'
import { EditIcon } from '@chakra-ui/icons'

export function EditableUserDisplayName({ detailValue, ...props }) {
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

  return (
    <Box {...props}>
      <Heading as="h3" size="md" mb="1">
        <Trans>Display Name:</Trans>
      </Heading>

      <Flex
        align="center"
        borderWidth="1px"
        borderColor="gray.500"
        rounded="md"
        p="1"
      >
        <UserIcon mr="2" ml="1" boxSize="icons.lg" aria-hidden="true" />
        <Text>{detailValue}</Text>
        <Button
          aria-label="Edit Display Name"
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
        <ModalContent pb="4">
          <Formik
            validateOnBlur={false}
            initialValues={{
              displayName: '',
            }}
            initialTouched={{
              displayName: true,
            }}
            validationSchema={createValidationSchema(['displayName'])}
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
    </Box>
  )
}

EditableUserDisplayName.propTypes = {
  detailValue: string,
}
