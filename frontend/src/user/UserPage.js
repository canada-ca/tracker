import React, { useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { EmailIcon, WarningTwoIcon } from '@chakra-ui/icons'
import { useMutation, useQuery } from '@apollo/client'
import { QUERY_CURRENT_USER } from '../graphql/queries'
import { useHistory } from 'react-router-dom'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Formik } from 'formik'
import { string } from 'prop-types'

import { EditableUserLanguage } from './EditableUserLanguage'
import { EditableUserDisplayName } from './EditableUserDisplayName'
import { EditableUserEmail } from './EditableUserEmail'
import { EditableUserPassword } from './EditableUserPassword'
import { EditableUserTFAMethod } from './EditableUserTFAMethod'
import { EditableUserPhoneNumber } from './EditableUserPhoneNumber'

import { FormField } from '../components/fields/FormField'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { createValidationSchema } from '../utilities/fieldRequirements'
import { useUserVar } from '../utilities/userState'
import {
  SEND_EMAIL_VERIFICATION,
  CLOSE_ACCOUNT,
  SIGN_OUT,
} from '../graphql/mutations'
import { NotificationBanner } from '../app/NotificationBanner'

export default function UserPage() {
  const toast = useToast()
  const history = useHistory()
  const { i18n } = useLingui()
  const [emailSent, setEmailSent] = useState(false)
  const { logout } = useUserVar()
  const [sendEmailVerification, { loading: loadEmailVerification }] =
    useMutation(SEND_EMAIL_VERIFICATION, {
      onError(error) {
        toast({
          title: error.message,
          description: t`Unable to send verification email`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted() {
        toast({
          title: t`Email successfully sent`,
          description: t`Check your associated Tracker email for the verification link`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        setEmailSent(true)
      },
    })

  const [closeAccount, { loading: loadingCloseAccount }] = useMutation(
    CLOSE_ACCOUNT,
    {
      onError(error) {
        toast({
          title: i18n._(t`An error occurred.`),
          description: error.message,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted({ closeAccount }) {
        if (closeAccount.result.__typename === 'CloseAccountResult') {
          toast({
            title: i18n._(t`Account Closed Successfully`),
            description: i18n._(
              t`Tracker account has been successfully closed.`,
            ),
            status: 'success',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          closeAccountOnClose()
          history.push('/')
        } else if (closeAccount.result.__typename === 'CloseAccountError') {
          toast({
            title: i18n._(t`Unable to close the account.`),
            description: closeAccount.result.description,
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
        } else {
          toast({
            title: i18n._(t`Incorrect send method received.`),
            description: i18n._(t`Incorrect closeAccount.result typename.`),
            status: 'error',
            duration: 9000,
            isClosable: true,
            position: 'top-left',
          })
          console.log('Incorrect closeAccount.result typename.')
        }
      },
    },
  )

  const [signOut] = useMutation(SIGN_OUT, {
    onCompleted() {
      logout()
    },
  })

  const {
    isOpen: closeAccountIsOpen,
    onOpen: closeAccountOnOpen,
    onClose: closeAccountOnClose,
  } = useDisclosure()

  const {
    loading: queryUserLoading,
    error: queryUserError,
    data: queryUserData,
  } = useQuery(QUERY_CURRENT_USER, { errorPolicy: 'ignore' })

  if (queryUserLoading) {
    return (
      <LoadingMessage>
        <Trans>Account Settings</Trans>
      </LoadingMessage>
    )
  }

  if (queryUserError) {
    return <ErrorFallbackMessage error={queryUserError} />
  }

  const {
    displayName,
    userName,
    preferredLang,
    phoneNumber,
    tfaSendMethod,
    emailValidated,
    phoneValidated,
  } = queryUserData?.userPage

  return (
    <Box w="100%">
      {tfaSendMethod === 'NONE' && queryUserData?.isUserAdmin && (
        <NotificationBanner bg="blue.200">
          <WarningTwoIcon color="orange.300" mr="2" />
          <Trans>
            Admin accounts must activate a multi-factor authentication option.
          </Trans>
        </NotificationBanner>
      )}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} width="100%">
        <Box mt={25} px="4">
          <EditableUserDisplayName detailValue={displayName} mb="8" />

          <EditableUserEmail detailValue={userName} mb="8" />

          <EditableUserPassword mb="8" />

          <EditableUserLanguage currentLang={preferredLang} />
        </Box>

        <Box mt={25} px="4">
          <EditableUserPhoneNumber detailValue={phoneNumber} mb="8" />

          <EditableUserTFAMethod
            isUserAdmin={queryUserData?.isUserAdmin}
            currentTFAMethod={tfaSendMethod}
            emailValidated={emailValidated}
            phoneValidated={phoneValidated}
            mb="16"
          />

          {!emailValidated && (
            <Button
              variant="primary"
              onClick={() => {
                sendEmailVerification({ variables: { userName: userName } })
              }}
              disabled={emailSent}
              isLoading={loadEmailVerification}
            >
              <EmailIcon mr={2} aria-hidden="true" />
              <Trans>Verify Account</Trans>
            </Button>
          )}
          <Flex>
            <Button
              variant="danger"
              onClick={() => {
                closeAccountOnOpen()
              }}
              w={{ base: '100%', md: 'auto' }}
              ml="auto"
              mb={2}
            >
              <Trans> Close Account </Trans>
            </Button>
          </Flex>
        </Box>

        <Modal
          isOpen={closeAccountIsOpen}
          onClose={closeAccountOnClose}
          motionPreset="slideInBottom"
        >
          <Formik
            validateOnBlur={false}
            initialValues={{
              matchEmail: '',
            }}
            initialTouched={{
              matchEmail: true,
            }}
            validationSchema={createValidationSchema(['matchEmail'], {
              matches: userName,
            })}
            onSubmit={async () => {
              await closeAccount({})
              signOut()
            }}
          >
            {({ handleSubmit }) => (
              <form onSubmit={handleSubmit}>
                <ModalOverlay />
                <ModalContent pb={4}>
                  <ModalHeader>
                    <Trans>Close Account</Trans>
                  </ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <Trans>
                      This action CANNOT be reversed, are you sure you wish to
                      to close the account {displayName}?
                    </Trans>

                    <Text mb="1rem">
                      <Trans>
                        Enter "{userName}" below to confirm removal. This field
                        is case-sensitive.
                      </Trans>
                    </Text>

                    <FormField
                      name="matchEmail"
                      label={t`User Email`}
                      placeholder={userName}
                    />
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      variant="primaryOutline"
                      mr="4"
                      onClick={closeAccountOnClose}
                    >
                      <Trans>Cancel</Trans>
                    </Button>

                    <Button
                      variant="primary"
                      mr="4"
                      type="submit"
                      isLoading={loadingCloseAccount}
                    >
                      <Trans>Confirm</Trans>
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </form>
            )}
          </Formik>
        </Modal>
      </SimpleGrid>
    </Box>
  )
}

UserPage.propTypes = { userName: string }
