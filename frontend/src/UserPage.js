import React from 'react'
import { useHistory, useLocation, Link as RouteLink } from 'react-router-dom'
import { string } from 'prop-types'
import {
  Stack,
  SimpleGrid,
  Divider,
  Heading,
  Icon,
  Text,
  Badge,
  Link,
} from '@chakra-ui/core'
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
import { ErrorBoundary } from 'react-error-boundary'
import { ListOf } from './ListOf'

export default function UserPage() {
  const location = useLocation()
  const history = useHistory()
  const { currentUser } = useUserState()

  // const {
  //   loading: queryUserLoading,
  //   error: queryUserError,
  //   data: queryUserData,
  // } = useQuery(QUERY_USER, {
  //   context: {
  //     headers: {
  //       authorization: currentUser.jwt,
  //     },
  //   },
  //   variables: {
  //     userName: currentUser.userName,
  //   },
  // })

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

  const affiliations = queryUserData.userPage.affiliations.edges.map(
    (e) => e.node,
  )

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
          <Trans>Organizations</Trans>
        </Heading>
        <ListOf
          elements={affiliations}
          ifEmpty={() => <Trans>No Organizations</Trans>}
          mb="4"
        >
          {({ permission, organization }, index) => (
            <ErrorBoundary key={`userpage-errorbound-${index}`} FallbackComponent={ErrorFallbackMessage}>
              <Stack
                mb="2"
                flexDirection={['column', 'row']}
                align={['flex-start', 'center']}
                key={`${organization.slug}:${index}`}
              >
                <Stack isInline align="center" w={['100%', '70%']}>
                  <Link
                    as={RouteLink}
                    to={`/organizations/${organization.slug}`}
                  >
                    <Text fontWeight="semibold" isTruncated mr="1">
                      {organization.name}
                    </Text>
                  </Link>
                  {organization.verified && (
                    <Icon name="check-circle" color="blue.500" />
                  )}
                </Stack>
                <Stack isInline align="center">
                  <Text fontWeight="bold">Role:</Text>
                  <Badge
                    color="primary"
                    bg="transparent"
                    borderColor="primary"
                    borderWidth="1px"
                  >
                    {permission}
                  </Badge>
                </Stack>
                <Divider />
              </Stack>
            </ErrorBoundary>
          )}
        </ListOf>
        <Divider />
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
