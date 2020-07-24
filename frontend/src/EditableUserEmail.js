import React from 'react'
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
import { object } from 'yup'
import { fieldRequirements } from './fieldRequirements'
import EmailField from './EmailField'

function EditableUserEmail({ detailValue }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { currentUser } = useUserState()
  const toast = useToast()
  const { i18n } = useLingui()

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
            t`Unable to update your email, please try again.`,
          ),
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
      onCompleted() {
        toast({
          title: 'Changed User Email',
          description: 'You have successfully updated your email.',
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
        <Trans>Email:</Trans>
      </Heading>

      <Stack isInline align="center">
        <Icon name="email" color="gray.300" />
        <Text>{detailValue}</Text>
        <Button ml="auto" onClick={onOpen} size="sm">
          <Trans>Edit</Trans>
        </Button>
      </Stack>

      <SlideIn in={isOpen}>
        {styles => (
          <Modal isOpen={true} onClose={onClose}>
            <ModalOverlay opacity={styles.opacity} />
            <ModalContent pb={4} {...styles}>
              <Formik
                initialValues={{
                  userName: '',
                }}
                validationSchema={object().shape({
                  email: fieldRequirements.email,
                })}
                onSubmit={async values => {
                  // Submit update detail mutation
                  await updateUserProfile({
                    variables: {
                      input: {
                        userName: values.userName,
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
                      <Stack spacing={4} p={25}>
                        <Heading as="h3" size="sm">
                          <Trans>Current Email:</Trans>
                        </Heading>

                        <Text>{detailValue}</Text>

                        <EmailField name="email" label="New Email Address:" />
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

EditableUserEmail.propTypes = {
  detailValue: string,
}

export default WithPseudoBox(EditableUserEmail)
