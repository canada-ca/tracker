import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { string } from 'prop-types'
import { Stack, SimpleGrid, Divider, Heading, Icon } from '@chakra-ui/core'
import { useQuery } from '@apollo/client'
import { useUserState } from './UserState'
import { QUERY_CURRENT_USER } from './graphql/queries'
import { Trans } from '@lingui/macro'
import EditableUserLanguage from './EditableUserLanguage'
import EditableUserDisplayName from './EditableUserDisplayName'
import EditableUserEmail from './EditableUserEmail'
import EditableUserPassword from './EditableUserPassword'
import { TrackerButton } from './TrackerButton'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'

export default function UserPage() {
  const location = useLocation()
  const history = useHistory()
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
        <Trans>User Profile</Trans>
      </LoadingMessage>
    )
  }

  if (queryUserError) {
    return <ErrorFallbackMessage error={queryUserError} />
  }

  return (
    <SimpleGrid columns={{ md: 1, lg: 2 }} spacing="60px" width="100%">
      <Stack p={25} spacing={4}>
        <EditableUserDisplayName
          detailValue={queryUserData.userPage.displayName}
        />

        <Divider />

        <EditableUserEmail detailValue={currentUser.userName} />

        <Divider />

        <EditableUserPassword />

        <Divider />

        <EditableUserLanguage
          currentLang={queryUserData.userPage.preferredLang}
        />
      </Stack>

      <Stack Stack p={25} spacing="4">
        <Heading as="h1" size="lg" textAlign="left">
          <Trans>Account Details</Trans>
        </Heading>
        <TrackerButton
          w={['100%', '50%']}
          variant="primary"
          onClick={() => {
            history.push('/two-factor-code')
          }}
          isDisabled={!!location.state}
        >
          <Icon name="lock" />
          <Trans>Enable 2FA</Trans>
        </TrackerButton>

        <TrackerButton
          w={['100%', '50%']}
          variant="primary"
          onClick={() => {
            window.alert('coming soon')
          }}
        >
          <Icon name="edit" />
          <Trans>Manage API keys</Trans>
        </TrackerButton>
        <Divider />
      </Stack>
    </SimpleGrid>
  )
}

UserPage.propTypes = { userName: string }
