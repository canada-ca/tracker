import React, { useState } from 'react'
import { string } from 'prop-types'
import {
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { EmailIcon } from '@chakra-ui/icons'
import { useMutation, useQuery } from '@apollo/client'
import { QUERY_CURRENT_USER } from './graphql/queries'
import { useHistory } from 'react-router-dom'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import EditableUserLanguage from './EditableUserLanguage'
import EditableUserDisplayName from './EditableUserDisplayName'
import EditableUserEmail from './EditableUserEmail'
import EditableUserPassword from './EditableUserPassword'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import EditableUserTFAMethod from './EditableUserTFAMethod'
import EditableUserPhoneNumber from './EditableUserPhoneNumber'
import { SEND_EMAIL_VERIFICATION, CLOSE_ACCOUNT } from './graphql/mutations'

export default function UserPage() {
  const toast = useToast()
  const history = useHistory()
  const { i18n } = useLingui()
  const [emailSent, setEmailSent] = useState(false)
  const [sendEmailVerification, { error }] = useMutation(
    SEND_EMAIL_VERIFICATION,
    {
      onError() {
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
    },
  )

  const [closeAccount] = useMutation(CLOSE_ACCOUNT, {
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
          title: i18n._(t`Account Closed Sussessfully`),
          description: i18n._(t`Traccer account has been successfully closed.`),
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
  } = useQuery(QUERY_CURRENT_USER, {})

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
    id,
    displayName,
    userName,
    preferredLang,
    phoneNumber,
    tfaSendMethod,
    emailValidated,
    phoneValidated,
  } = queryUserData?.userPage

  return (
    <SimpleGrid columns={{ md: 1, lg: 2 }} width="100%">
      <Stack py={25} px="4">
        <EditableUserDisplayName detailValue={displayName} />

        <Divider />

        <EditableUserEmail detailValue={userName} />

        <Divider />

        <EditableUserPassword />

        <Divider />

        <EditableUserLanguage currentLang={preferredLang} />
      </Stack>

      <Stack p={25} spacing={4}>
        <EditableUserPhoneNumber detailValue={phoneNumber} />

        <Divider />

        <EditableUserTFAMethod
          currentTFAMethod={tfaSendMethod}
          emailValidated={emailValidated}
          phoneValidated={phoneValidated}
        />

        {!emailValidated && (
          <Button
            variant="primary"
            onClick={() => {
              sendEmailVerification({ variables: { userName: userName } })
            }}
            disabled={emailSent}
          >
            <EmailIcon mr={2} aria-hidden="true" />
            <Trans>Verify Email</Trans>
          </Button>
        )}

        <Divider />

        <Button
          variant="danger"
          onClick={() => {
            closeAccountOnOpen()
          }}
          ml="auto"
          w={{ base: '100%', md: 'auto' }}
          mb={2}
        >
          <Trans> Close Account </Trans>
        </Button>
      </Stack>

      <Modal
        isOpen={closeAccountIsOpen}
        onClose={closeAccountOnClose}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent pb={4}>
          <ModalHeader>
            <Trans>Close Account</Trans>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Trans>
              This action CANNOT be reversed, are you sure you wish to to close
              the account {displayName}?
            </Trans>
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
              onClick={async () => {
                await closeAccount({
                  variables: {
                    userId: id,
                  },
                })
              }}
            >
              <Trans>Confirm</Trans>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SimpleGrid>
  )
}

UserPage.propTypes = { userName: string }
