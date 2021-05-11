import React from 'react'
import { string } from 'prop-types'
import { Stack, SimpleGrid, Divider } from '@chakra-ui/core'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'
import { QUERY_CURRENT_USER } from './graphql/queries'
import { Trans } from '@lingui/macro'
import EditableUserLanguage from './EditableUserLanguage'
import EditableUserDisplayName from './EditableUserDisplayName'
import EditableUserEmail from './EditableUserEmail'
import EditableUserPassword from './EditableUserPassword'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import EditableUserTFAMethod from './EditableUserTFAMethod'
import EditableUserPhoneNumber from './EditableUserPhoneNumber'

export default function UserPage() {
  const { currentUser } = useUserState()

  const {
    loading: queryUserLoading,
    error: queryUserError,
    data: queryUserData,
  } = useQuery(QUERY_CURRENT_USER, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
  })

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
      </Stack>
    </SimpleGrid>
  )
}

UserPage.propTypes = { userName: string }
