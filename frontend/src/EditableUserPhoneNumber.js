import React, { useRef } from 'react'
import { string } from 'prop-types'
import {
  Icon,
  Heading,
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
import { i18n } from '@lingui/core'
import { UPDATE_USER_PROFILE } from './graphql/mutations'
import { useMutation } from '@apollo/client'
import { useUserState } from './UserState'
import { number, object } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import { TrackerButton } from './TrackerButton'
import PhoneNumberField from './PhoneNumberField'
import { UpdateUserProfilePhoneNumber } from './graphql/fragments'

function EditableUserPhoneNumber({ detailValue }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { currentUser } = useUserState()
  const toast = useToast()
  const initialFocusRef = useRef()

  const [updateUserProfile, { error: _updateUserProfileError }] = useMutation(
    UPDATE_USER_PROFILE({
      UpdateUserProfileFields: UpdateUserProfilePhoneNumber,
    }),
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
      onError: ({ message }) => {
        toast({
          title: t`An error occurred while updating your phone number.`,
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
            title: t`Changed User Phone Number`,
            description: t`You have successfully updated your phone number.`,
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
            title: t`Unable to update to your phone number, please try again.`,
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
    phoneNumber: number()
      .required(i18n._(fieldRequirements.phoneNumber.required.message))
      .typeError(i18n._(fieldRequirements.phoneNumber.typeError.message)),
  })

  return (
    <Stack>
      <Heading as="h3" size="md">
        <Trans>Phone Number:</Trans>
      </Heading>

      <Stack isInline align="center">
        <Icon name="phone" color="gray.300" />
        {detailValue ? (
          <Text>{detailValue}</Text>
        ) : (
          <Trans>No current phone number</Trans>
        )}
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
                  phoneNumber: '',
                }}
                validationSchema={validationSchema}
                onSubmit={async (values) => {
                  // Submit update detail mutation
                  await updateUserProfile({
                    variables: {
                      phoneNumber: values.phoneNumber,
                    },
                  })
                }}
              >
                {({ handleSubmit, isSubmitting }) => (
                  <form id="form" onSubmit={handleSubmit}>
                    <ModalHeader>
                      <Trans>Edit </Trans>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <Stack spacing="4" p="6">
                        {detailValue && (
                          <Stack>
                            <Heading as="h3" size="sm">
                              <Trans>Current Phone Number:</Trans>
                            </Heading>

                            <Text>{detailValue}</Text>
                          </Stack>
                        )}

                        <PhoneNumberField
                          name="phoneNumber"
                          label={t`New Phone Number:`}
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

EditableUserPhoneNumber.propTypes = {
  detailValue: string,
}

export default WithPseudoBox(EditableUserPhoneNumber)
