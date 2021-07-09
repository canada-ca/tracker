import React, { useRef } from 'react'
import { string } from 'prop-types'
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
import DisplayNameField from './DisplayNameField'
import { UPDATE_USER_PROFILE } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { fieldRequirements } from './fieldRequirements'
import { object, string as yupString } from 'yup'
import { TrackerButton } from './TrackerButton'

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

      <Stack isInline align="center">
        <Icon name="person" size="icons.lg" color="gray.300" />
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
      </Stack>

      <SlideIn in={isOpen}>
        {(styles) => (
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

EditableUserDisplayName.propTypes = {
  detailValue: string,
}

export default WithWrapperBox(EditableUserDisplayName)
