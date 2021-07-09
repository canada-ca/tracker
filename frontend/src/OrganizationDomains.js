import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Divider, Text } from '@chakra-ui/react'
import { PAGINATED_ORG_DOMAINS as FORWARD } from './graphql/queries'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { DomainCard } from './DomainCard'
import { ListOf } from './ListOf'
import { usePaginatedCollection } from './usePaginatedCollection'
import { number, string } from 'prop-types'
import { RelayPaginationControls } from './RelayPaginationControls'

export function OrganizationDomains({ domainsPerPage = 10, orgSlug }) {
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
    recordsPerPage: domainsPerPage,
    relayRoot: 'findOrganizationBySlug.domains',
  })

  if (error) return <ErrorFallbackMessage error={error} />

  if (loading)
    return (
      <LoadingMessage>
        <Trans>Domains</Trans>
      </LoadingMessage>
    )

  return (
    <Box>
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text fontSize="xl" fontWeight="bold">
            <Trans>No Domains</Trans>
          </Text>
        )}
        mb="4"
      >
        {({ id, domain, lastRan, status, hasDMARCReport }, index) => (
          <ErrorBoundary
            key={`${id}:${index}`}
            FallbackComponent={ErrorFallbackMessage}
          >
            <Box>
              <DomainCard
                url={domain}
                lastRan={lastRan}
                status={status}
                hasDMARCReport={hasDMARCReport}
              />
              <Divider borderColor="gray.900" />
            </Box>
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
  )
}

OrganizationDomains.propTypes = { domainsPerPage: number, orgSlug: string }
