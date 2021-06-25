import React, { useState } from 'react'
import { string } from 'prop-types'
import { Divider, Icon, SimpleGrid, Stack, useToast } from '@chakra-ui/core'
import { useMutation, useQuery } from '@apollo/client'
import { QUERY_CURRENT_USER } from './graphql/queries'
import { t, Trans } from '@lingui/macro'
import EditableUserLanguage from './EditableUserLanguage'
import EditableUserDisplayName from './EditableUserDisplayName'
import EditableUserEmail from './EditableUserEmail'
import EditableUserPassword from './EditableUserPassword'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import EditableUserTFAMethod from './EditableUserTFAMethod'
import EditableUserPhoneNumber from './EditableUserPhoneNumber'
import { TrackerButton } from './TrackerButton'
import { SEND_EMAIL_VERIFICATION } from './graphql/mutations'

export default function UserPage() {
  const toast = useToast()
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
          <TrackerButton
            variant="primary"
            onClick={() => {
              sendEmailVerification({ variables: { userName: userName } })
            }}
            disabled={emailSent}
          >
            <Icon name="email" />
            <Trans>Verify Email</Trans>
          </TrackerButton>
        )}
      </Stack>
    </SimpleGrid>
  )
}

UserPage.propTypes = { userName: string }
