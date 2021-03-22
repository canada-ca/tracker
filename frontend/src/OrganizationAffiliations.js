import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Divider, Text } from '@chakra-ui/core'
import {
  REVERSE_PAGINATED_ORG_AFFILIATIONS as BACKWARD,
  PAGINATED_ORG_AFFILIATIONS as FORWARD,
} from './graphql/queries'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { ListOf } from './ListOf'
import { useUserState } from './UserState'
import { usePaginatedCollection } from './usePaginatedCollection'
import { number, string } from 'prop-types'
import { RelayPaginationControls } from './RelayPaginationControls'
import { UserCard } from './UserCard'

export function OrganizationAffiliations({ usersPerPage = 10, orgSlug }) {
  const { currentUser } = useUserState()
  const {
    loading,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    fetchBackward: BACKWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    variables: { slug: orgSlug },
    recordsPerPage: usersPerPage,
    relayRoot: 'findOrganizationBySlug.affiliations',
  })

  if (error) return <ErrorFallbackMessage error={error} />

  if (loading)
    return (
      <LoadingMessage>
        <Trans>User Affiliations</Trans>
      </LoadingMessage>
    )

  return (
    <Box>
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text fontSize="xl" fontWeight="bold">
            <Trans>No Users</Trans>
          </Text>
        )}
        mb="4"
      >
        {({ permission, user }, index) => (
          <ErrorBoundary
            FallbackComponent={ErrorFallbackMessage}
            key={`${user.id}:${index}`}
          >
            <UserCard
              userName={user.userName}
              role={permission}
              tfa={user.tfaValidated}
            />
            <Divider borderColor="gray.900" />
          </ErrorBoundary>
        )}
      </ListOf>
      <RelayPaginationControls
        onlyPagination={true}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
      />
    </Box>
  )
}

OrganizationAffiliations.propTypes = { usersPerPage: number, orgSlug: string }
