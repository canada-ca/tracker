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
import { object } from 'yup'

function EditableUserDisplayName({ detailValue }) {
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
            t`Unable to update your display name, please try again.`,
          ),
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
      onCompleted() {
        toast({
          title: 'Changed User Display Name',
          description: 'You have successfully updated your display name.',
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
        <Trans>Display Name:</Trans>
      </Heading>

      <Stack isInline align="center">
        <Icon name="person" size="1.5rem" color="gray.300" />
        <Text>{detailValue}</Text>
        <Button ml="auto" onClick={onOpen} size="sm" variantColor="teal">
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
                validateOnBlur={false}
                initialValues={{
                  displayName: '',
                }}
                initialTouched={{
                  displayName: true,
                }}
                validationSchema={object().shape({
                  displayName: fieldRequirements.displayName,
                })}
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
                      <Stack spacing={4} p={25}>
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

EditableUserDisplayName.propTypes = {
  detailValue: string,
}

export default WithPseudoBox(EditableUserDisplayName)
