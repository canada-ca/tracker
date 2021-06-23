import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Divider, Text } from '@chakra-ui/core'
import { PAGINATED_ORG_AFFILIATIONS as FORWARD } from './graphql/queries'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { ListOf } from './ListOf'
import { useUserVar } from './useUserVar'
import { usePaginatedCollection } from './usePaginatedCollection'
import { number, string } from 'prop-types'
import { RelayPaginationControls } from './RelayPaginationControls'
import { UserCard } from './UserCard'

export function OrganizationAffiliations({ usersPerPage = 10, orgSlug }) {
  const { currentUser } = useUserVar()
  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
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
    <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
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
                displayName={user.displayName}
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
          isLoadingMore={isLoadingMore}
        />
      </Box>
    </ErrorBoundary>
  )
}

OrganizationAffiliations.propTypes = { usersPerPage: number, orgSlug: string }
