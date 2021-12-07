import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Divider, Text } from '@chakra-ui/react'
import { ErrorBoundary } from 'react-error-boundary'
import { number, string } from 'prop-types'

import { ListOf } from '../components/ListOf'
import { UserCard } from '../components/UserCard'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { PAGINATED_ORG_AFFILIATIONS as FORWARD } from '../graphql/queries'

export function OrganizationAffiliations({ usersPerPage = 10, orgSlug }) {
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
    variables: { slug: orgSlug },
    recordsPerPage: usersPerPage,
    relayRoot: 'findOrganizationBySlug.affiliations',
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
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
            <Text layerStyle="loadingMessage">
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
