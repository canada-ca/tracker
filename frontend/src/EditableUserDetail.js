import React from 'react'
import { element, func, string } from 'prop-types'
import {
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Heading,
  InputRightElement,
  Button,
  Stack,
  Text,
  Box,
  ButtonGroup,
  PseudoBox,
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

function EditableUserDetail({
  detailName,
  detailValue,
  iconName,
  iconSize,
  body,
  title,
  detailHeading,
  toastDescriptionCompleted,
  validationSchema,
  ...props
}) {
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
            t`Unable to update your profile, please try again.`,
          ),
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
      onCompleted() {
        // Display a welcome message
        toast({
          title: 'Changed User Profile',
          description: toastDescriptionCompleted,
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
        {detailName}
      </Heading>

      <Stack isInline align="center">
        <Icon name={iconName} size={iconSize} color="gray.300" />
        <Text>{detailValue}</Text>
        <Button ml="auto" onClick={onOpen} size="sm">
          Edit
        </Button>
      </Stack>

      <SlideIn in={isOpen}>
        {styles => (
          <Modal isOpen={true} onClose={onClose}>
            <ModalOverlay opacity={styles.opacity} />
            <ModalContent pb={4} {...styles}>
              <Formik
                initialValues={{
                  displayName: '',
                  userName: '',
                  password: '',
                  confirmPassword: '',
                  preferredLang: '',
                  currentPassword: '',
                }}
                validationSchema={validationSchema}
                onSubmit={async values => {
                  // Submit update detail mutation
                  await updateUserProfile({
                    variables: {
                      input: {
                        displayName: values.displayName,
                        userName: values.userName,
                        password: values.password,
                        confirmPassword: values.confirmPassword,
                        preferredLang: values.lang,
                        currentPassword: values.currentPassword,
                      },
                    },
                  })
                }}
              >
                {({ handleSubmit, isSubmitting }) => (
                  <form id="form" onSubmit={handleSubmit}>
                    <ModalHeader>{title}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <Stack spacing={4} p={25}>
                        <Heading as="h3" size="sm">
                          {detailHeading}
                        </Heading>

                        <Text>{detailHeading && detailValue}</Text>

                        {body}
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

EditableUserDetail.propTypes = {
  detailName: string,
  detailValue: string,
  iconName: string,
  iconSize: string,
  mutation: func,
  body: element,
  title: string,
  detailHeading: string,
}

export default WithPseudoBox(EditableUserDetail)
